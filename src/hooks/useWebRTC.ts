/**
 * WebRTC Hook for FreeSWITCH Test Calls
 * Uses SIP.js for WebRTC connection to FreeSWITCH
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { UserAgent, Registerer, Inviter, SessionState } from 'sip.js';
import { apiClient } from '../services/apiClient';

export interface WebRTCCallState {
  isConnected: boolean;
  isCalling: boolean;
  isInCall: boolean;
  callStatus: 'idle' | 'connecting' | 'ringing' | 'active' | 'ended' | 'error';
  error: string | null;
  transcript: Array<{ role: 'user' | 'assistant'; text: string; timestamp: string }>;
}

export interface UseWebRTCOptions {
  locationId: string;
  agentId?: string;
  onTranscriptUpdate?: (transcript: Array<{ role: 'user' | 'assistant'; text: string; timestamp: string }>) => void;
}

export function useWebRTC(options: UseWebRTCOptions) {
  const { locationId, agentId, onTranscriptUpdate } = options;

  const [state, setState] = useState<WebRTCCallState>({
    isConnected: false,
    isCalling: false,
    isInCall: false,
    callStatus: 'idle',
    error: null,
    transcript: [],
  });

  const userAgentRef = useRef<UserAgent | null>(null);
  const registererRef = useRef<Registerer | null>(null);
  const sessionRef = useRef<Inviter | null>(null);
  const transcriptPollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const callSidRef = useRef<string | null>(null);

  // FreeSWITCH WebRTC settings - fetch from backend
  const [freeswitchConfig, setFreeswitchConfig] = useState<{
    wss_url: string;
    sip_username: string;
    sip_password: string;
    extension: string;
  } | null>(null);

  // Fetch FreeSWITCH config from backend
  useEffect(() => {
    const fetchConfig = async () => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/30ee3678-5abc-4df4-b37b-e571a3b256e0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useWebRTC.ts:53',message:'Config fetch started',data:{locationId,envProd:import.meta.env.PROD},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H5'})}).catch(()=>{});
      // #endregion
      try {
        const response = await apiClient.get<{ success: boolean; config?: any }>('/v1/test-call/config');
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/30ee3678-5abc-4df4-b37b-e571a3b256e0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useWebRTC.ts:56',message:'Config fetch response received',data:{success:response.data?.success,hasConfig:!!response.data?.config,config:response.data?.config},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H5'})}).catch(()=>{});
        // #endregion
        if (response.data?.success && response.data.config) {
          console.log('[useWebRTC] FreeSWITCH config loaded:', response.data.config);
          setFreeswitchConfig(response.data.config);
        } else {
          throw new Error('Invalid config response');
        }
      } catch (error: any) {
        console.error('[useWebRTC] Failed to fetch FreeSWITCH config:', error);
        console.error('[useWebRTC] Error details:', {
          message: error?.message,
          status: error?.response?.status,
          data: error?.response?.data,
        });
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/30ee3678-5abc-4df4-b37b-e571a3b256e0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useWebRTC.ts:63',message:'Config fetch failed, using fallback',data:{errorMessage:error?.message,errorStatus:error?.response?.status,errorData:error?.response?.data},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H5'})}).catch(()=>{});
        // #endregion
        
        // Fallback to defaults based on environment
        const fallbackUrl = import.meta.env.PROD 
          ? 'wss://freeswitch.aidevelo.ai'
          : (import.meta.env.VITE_FREESWITCH_WSS_URL || 'wss://localhost:7443');
        
        console.warn('[useWebRTC] Using fallback config:', { wss_url: fallbackUrl });
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/30ee3678-5abc-4df4-b37b-e571a3b256e0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useWebRTC.ts:75',message:'Fallback config set',data:{fallbackUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H5'})}).catch(()=>{});
        // #endregion
        setFreeswitchConfig({
          wss_url: fallbackUrl,
          sip_username: `test_${locationId}`,
          sip_password: 'test123',
          extension: '1000',
        });
      }
    };
    fetchConfig();
  }, [locationId]);

  // Remove port from WSS URL in production (Cloudflare Tunnel handles port)
  // Keep port for localhost (development)
  const rawWssUrl = freeswitchConfig?.wss_url || 'wss://localhost:7443';
  const freeswitchWssUrl = rawWssUrl.includes('localhost') 
    ? rawWssUrl  // Keep port for localhost
    : rawWssUrl.replace(/:(\d+)$/, ''); // Remove port for production (Cloudflare Tunnel)
  const sipUsername = freeswitchConfig?.sip_username || `test_${locationId}`;
  const sipPassword = freeswitchConfig?.sip_password || 'test123';
  const extension = freeswitchConfig?.extension || '1000';

  /**
   * Connect to FreeSWITCH
   */
  const connect = useCallback(async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/30ee3678-5abc-4df4-b37b-e571a3b256e0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useWebRTC.ts:100',message:'Connect function called',data:{hasConfig:!!freeswitchConfig,rawWssUrl:freeswitchConfig?.wss_url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H2,H3,H4,H6,H7'})}).catch(()=>{});
    // #endregion
    if (!freeswitchConfig) {
      setState(prev => ({
        ...prev,
        error: 'FreeSWITCH configuration not loaded yet. Please wait...',
        callStatus: 'error',
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, error: null, callStatus: 'connecting' }));

      // Extract hostname from WSS URL (remove wss:// and port if present)
      // For SIP URI, we only need the hostname, not the port
      // IMPORTANT: If URL contains IP address, convert to domain name for CSP compliance
      let hostname = freeswitchWssUrl.replace(/^wss?:\/\//, '').split(':')[0].split('/')[0];
      
      // If hostname is an IP address, use domain instead (for CSP compliance)
      // This ensures we always use freeswitch.aidevelo.ai instead of IP
      if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
        hostname = 'freeswitch.aidevelo.ai';
        console.warn('[useWebRTC] IP address detected in WSS URL, using domain instead:', hostname);
      }

      // Create UserAgent
      // SIP URI should be: sip:username@domain (no port)
      // The port is only used for the WebSocket transport (server option)
      // IMPORTANT: Use domain name for server URL (not IP) for CSP compliance
      let serverUrl = freeswitchWssUrl;
      if (freeswitchWssUrl.includes('91.99.202.18')) {
        serverUrl = 'wss://freeswitch.aidevelo.ai';
        console.warn('[useWebRTC] IP address in server URL, using domain instead:', serverUrl);
      }
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/30ee3678-5abc-4df4-b37b-e571a3b256e0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useWebRTC.ts:129',message:'Before UserAgent creation',data:{freeswitchWssUrl,hostname,serverUrl,sipUsername},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H2,H3,H4,H6,H7'})}).catch(()=>{});
      // #endregion
      
      const userAgent = new UserAgent({
        uri: UserAgent.makeURI(`sip:${sipUsername}@${hostname}`),
        transportOptions: {
          server: serverUrl,
          connectionTimeout: 10,
          // SIP.js automatically sends Sec-WebSocket-Protocol: sip
          // FreeSWITCH must return this header for handshake to succeed
          // If FreeSWITCH doesn't return it, the connection will fail
        },
        authorizationUsername: sipUsername,
        authorizationPassword: sipPassword,
        sessionDescriptionHandlerFactoryOptions: {
          peerConnectionConfiguration: {
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
          },
        },
      });

      userAgentRef.current = userAgent;

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/30ee3678-5abc-4df4-b37b-e571a3b256e0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useWebRTC.ts:156',message:'Before userAgent.start()',data:{serverUrl,hostname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H2,H3,H4,H6,H7'})}).catch(()=>{});
      // #endregion

      // Connect
      await userAgent.start();

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/30ee3678-5abc-4df4-b37b-e571a3b256e0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useWebRTC.ts:162',message:'After userAgent.start()',data:{transportState:userAgent.transport.state},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H2,H3,H4,H6,H7'})}).catch(()=>{});
      // #endregion

      // Register
      const registerer = new Registerer(userAgent);
      registererRef.current = registerer;

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/30ee3678-5abc-4df4-b37b-e571a3b256e0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useWebRTC.ts:167',message:'Before registerer.register()',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H2,H3,H4,H6,H7'})}).catch(()=>{});
      // #endregion

      await registerer.register();

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/30ee3678-5abc-4df4-b37b-e571a3b256e0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useWebRTC.ts:171',message:'After registerer.register() - success',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H2,H3,H4,H6,H7'})}).catch(()=>{});
      // #endregion

      setState(prev => ({
        ...prev,
        isConnected: true,
        callStatus: 'idle',
      }));
    } catch (error: any) {
      console.error('[useWebRTC] Connect error:', error);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/30ee3678-5abc-4df4-b37b-e571a3b256e0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useWebRTC.ts:175',message:'Connect error caught',data:{errorMessage:error?.message,errorStack:error?.stack,errorName:error?.name,errorCode:error?.code,hasTransport:!!userAgentRef.current?.transport,transportState:userAgentRef.current?.transport?.state},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H2,H3,H4,H6,H7'})}).catch(()=>{});
      // #endregion
      
      // Provide more helpful error messages
      let errorMessage = 'Failed to connect to FreeSWITCH';
      if (error.message?.includes('1006') || error.message?.includes('closed')) {
        errorMessage = 'FreeSWITCH server is not reachable. Please ensure FreeSWITCH is running and accessible at the configured URL.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Connection timeout. FreeSWITCH server may be down or unreachable.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
        callStatus: 'error',
      }));
    }
  }, [freeswitchConfig, freeswitchWssUrl, sipUsername, sipPassword]);

  /**
   * Start call to AI Agent
   */
  const startCall = useCallback(async () => {
    if (!userAgentRef.current || !registererRef.current) {
      await connect();
    }

    try {
      setState(prev => ({ ...prev, isCalling: true, callStatus: 'ringing' }));

      const userAgent = userAgentRef.current!;
      // Extract hostname for SIP URI (no port, no protocol)
      const hostname = freeswitchWssUrl.replace(/^wss?:\/\//, '').split(':')[0].split('/')[0];
      const targetURI = UserAgent.makeURI(`sip:${extension}@${hostname}`);

      if (!targetURI) {
        throw new Error('Invalid target URI');
      }

      // Create Inviter
      const inviter = new Inviter(userAgent, targetURI, {
        sessionDescriptionHandlerOptions: {
          constraints: {
            audio: true,
            video: false,
          },
        },
      });

      sessionRef.current = inviter;

      // Handle session state changes
      inviter.stateChange.addListener((newState: SessionState) => {
        console.log('[useWebRTC] Session state:', newState);
        
        if (newState === SessionState.Established) {
          setState(prev => ({
            ...prev,
            isInCall: true,
            callStatus: 'active',
            isCalling: false,
          }));

          // Start polling for transcript
          startTranscriptPolling();
        } else if (newState === SessionState.Terminated) {
          setState(prev => ({
            ...prev,
            isInCall: false,
            callStatus: 'ended',
            isCalling: false,
          }));

          stopTranscriptPolling();
        }
      });

      // Invite
      await inviter.invite();

      // Extract call_sid from session (if available in headers)
      // For now, we'll use a generated ID
      callSidRef.current = `webrtc_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    } catch (error: any) {
      console.error('[useWebRTC] Start call error:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to start call',
        callStatus: 'error',
        isCalling: false,
      }));
    }
  }, [connect, extension, freeswitchWssUrl]);

  /**
   * End call
   */
  const endCall = useCallback(async () => {
    if (sessionRef.current) {
      await sessionRef.current.bye();
      sessionRef.current = null;
    }

    stopTranscriptPolling();

    setState(prev => ({
      ...prev,
      isInCall: false,
      callStatus: 'ended',
      isCalling: false,
    }));
  }, []);

  /**
   * Disconnect from FreeSWITCH
   */
  const disconnect = useCallback(async () => {
    await endCall();

    if (registererRef.current) {
      await registererRef.current.unregister();
      registererRef.current = null;
    }

    if (userAgentRef.current) {
      await userAgentRef.current.stop();
      userAgentRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isConnected: false,
      callStatus: 'idle',
    }));
  }, [endCall]);

  /**
   * Poll for transcript updates
   */
  const startTranscriptPolling = useCallback(() => {
    if (!callSidRef.current) return;

    const pollTranscript = async () => {
      try {
        const response = await fetch(
          `/api/v1/test-call/${callSidRef.current}/transcript`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.transcript && Array.isArray(data.transcript)) {
            setState(prev => {
              const newTranscript = data.transcript;
              if (JSON.stringify(prev.transcript) !== JSON.stringify(newTranscript)) {
                if (onTranscriptUpdate) {
                  onTranscriptUpdate(newTranscript);
                }
                return { ...prev, transcript: newTranscript };
              }
              return prev;
            });
          }
        }
      } catch (error) {
        console.error('[useWebRTC] Transcript poll error:', error);
      }
    };

    // Poll every 2 seconds
    transcriptPollIntervalRef.current = setInterval(pollTranscript, 2000);
    pollTranscript(); // Initial poll
  }, [onTranscriptUpdate]);

  const stopTranscriptPolling = useCallback(() => {
    if (transcriptPollIntervalRef.current) {
      clearInterval(transcriptPollIntervalRef.current);
      transcriptPollIntervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTranscriptPolling();
      if (sessionRef.current) {
        sessionRef.current.bye().catch(console.error);
      }
      if (registererRef.current) {
        registererRef.current.unregister().catch(console.error);
      }
      if (userAgentRef.current) {
        userAgentRef.current.stop().catch(console.error);
      }
    };
  }, [stopTranscriptPolling]);

  return {
    ...state,
    connect,
    startCall,
    endCall,
    disconnect,
  };
}

