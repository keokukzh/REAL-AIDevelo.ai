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
      try {
        const response = await apiClient.get<{ success: boolean; config?: any }>('/v1/test-call/config');
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
        
        // Fallback to defaults based on environment
        const fallbackUrl = import.meta.env.PROD 
          ? 'wss://freeswitch.aidevelo.ai'
          : (import.meta.env.VITE_FREESWITCH_WSS_URL || 'wss://localhost:7443');
        
        console.warn('[useWebRTC] Using fallback config:', { wss_url: fallbackUrl });
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

      // Listen for transport state changes using UserAgent delegate
      userAgent.delegate = {
        onTransportError: (error: Error) => {
          console.error('[useWebRTC] Transport error:', error);
          setState(prev => ({
            ...prev,
            isConnected: false,
            callStatus: 'error',
            error: 'Verbindung zu FreeSWITCH verloren. Bitte erneut verbinden.',
          }));
        },
      };

      // Connect - wait for transport to be ready
      await userAgent.start();

      // Wait for transport to be connected
      // Use a Promise-based approach to wait for transport connection
      let transportConnected = false;
      const transportCheckPromise = new Promise<void>((resolve, reject) => {
        const checkTransport = () => {
          try {
            // Check if transport exists and is connected
            const transport = userAgent.transport;
            if (transport && (transport.state === 'Connected' || transport.isConnected?.())) {
              transportConnected = true;
              resolve();
              return;
            }
          } catch (e) {
            // Transport might not be ready yet
          }
        };

        // Check immediately
        checkTransport();
        if (transportConnected) return;

        // Poll for connection (max 5 seconds)
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          checkTransport();
          if (transportConnected) {
            clearInterval(interval);
            return;
          }
          if (attempts >= 50) {
            clearInterval(interval);
            reject(new Error('Transport-Verbindung konnte nicht hergestellt werden.'));
          }
        }, 100);
      });

      try {
        await transportCheckPromise;
      } catch (error: any) {
        throw new Error('Verbindung zu FreeSWITCH konnte nicht hergestellt werden. Bitte erneut versuchen.');
      }

      // Register
      const registerer = new Registerer(userAgent);
      registererRef.current = registerer;

      // Wait for registration to complete
      await registerer.register();
      
      // Wait a bit for registration to settle
      await new Promise(resolve => setTimeout(resolve, 200));

      setState(prev => ({
        ...prev,
        isConnected: true,
        callStatus: 'idle',
      }));
    } catch (error: any) {
      console.error('[useWebRTC] Connect error:', error);
      
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

    // Verify UserAgent is still connected before starting call
    const userAgent = userAgentRef.current;
    if (!userAgent) {
      throw new Error('UserAgent nicht verfügbar. Bitte erneut verbinden.');
    }

    // Check if transport is connected
    const isTransportConnected = () => {
      try {
        const transport = userAgent.transport;
        return transport && (transport.state === 'Connected' || transport.isConnected?.());
      } catch {
        return false;
      }
    };

    if (!isTransportConnected()) {
      console.warn('[useWebRTC] Transport not connected, reconnecting...');
      await connect();
      // Wait a bit for connection to stabilize
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check again
      if (!userAgentRef.current || !isTransportConnected()) {
        throw new Error('Verbindung zu FreeSWITCH konnte nicht hergestellt werden. Bitte erneut versuchen.');
      }
    }
    
    // Also verify registerer is registered
    if (!registererRef.current) {
      console.warn('[useWebRTC] Registerer not available, reconnecting...');
      await connect();
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    try {
      setState(prev => ({ ...prev, isCalling: true, callStatus: 'connecting', error: null }));

      // Request microphone permission and check availability
      try {
        // First, request permission by trying to get user media
        // This will prompt the user for permission if not already granted
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        
        // After permission is granted, enumerate devices to verify microphone is available
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        
        // Stop the stream immediately - we just needed permission
        stream.getTracks().forEach(track => track.stop());
        
        if (audioInputs.length === 0) {
          throw new Error('Kein Mikrofon gefunden. Bitte stellen Sie sicher, dass ein Mikrofon angeschlossen ist.');
        }
        
        console.log('[useWebRTC] Microphone permission granted, found', audioInputs.length, 'audio input(s)');
      } catch (error: any) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          throw new Error('Mikrofon-Berechtigung verweigert. Bitte erlauben Sie den Zugriff auf Ihr Mikrofon in den Browser-Einstellungen.');
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          throw new Error('Kein Mikrofon gefunden. Bitte stellen Sie sicher, dass ein Mikrofon angeschlossen ist.');
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          throw new Error('Mikrofon wird bereits von einer anderen Anwendung verwendet. Bitte schließen Sie andere Anwendungen.');
        } else {
          throw new Error(`Mikrofon-Fehler: ${error.message || 'Unbekannter Fehler'}`);
        }
      }

      const userAgent = userAgentRef.current!;
      
      // Double-check transport is connected before creating INVITE
      const isTransportConnected = () => {
        try {
          const transport = userAgent.transport;
          return transport && (transport.state === 'Connected' || transport.isConnected?.());
        } catch {
          return false;
        }
      };

      if (!isTransportConnected()) {
        throw new Error('Transport-Verbindung verloren. Bitte erneut verbinden.');
      }
      
      // Extract hostname for SIP URI (no port, no protocol)
      const hostname = freeswitchWssUrl.replace(/^wss?:\/\//, '').split(':')[0].split('/')[0];
      const targetURI = UserAgent.makeURI(`sip:${extension}@${hostname}`);

      if (!targetURI) {
        throw new Error('Invalid target URI');
      }

      // Create Inviter with custom headers to pass location_id and agent_id to FreeSWITCH
      const inviter = new Inviter(userAgent, targetURI, {
        sessionDescriptionHandlerOptions: {
          constraints: {
            audio: true,
            video: false,
          },
        },
        // Pass location_id and agent_id via SIP headers
        // FreeSWITCH will extract these as variables: ${sip_h_X-Location-Id}
        extraHeaders: [
          `X-Location-Id: ${locationId}`,
          agentId ? `X-Agent-Id: ${agentId}` : null,
        ].filter(Boolean) as string[],
      });

      sessionRef.current = inviter;

      // Handle session state changes
      inviter.stateChange.addListener((newState: SessionState) => {
        console.log('[useWebRTC] Session state:', newState, SessionState[newState]);
        
        // Handle all session states
        switch (newState) {
          case SessionState.Initial:
            console.log('[useWebRTC] Call initializing...');
            setState(prev => ({ ...prev, callStatus: 'connecting' }));
            break;
            
          case SessionState.Establishing:
            console.log('[useWebRTC] Call establishing...');
            setState(prev => ({ ...prev, callStatus: 'ringing' }));
            break;
            
          case SessionState.Established:
            console.log('[useWebRTC] Call established!');
            setState(prev => ({
              ...prev,
              isInCall: true,
              callStatus: 'active',
              isCalling: false,
            }));
            // Start polling for transcript
            startTranscriptPolling();
            break;
            
          case SessionState.Terminating:
            console.log('[useWebRTC] Call terminating...');
            setState(prev => ({ ...prev, callStatus: 'ended' }));
            break;
            
          case SessionState.Terminated:
            console.log('[useWebRTC] Call terminated');
            setState(prev => ({
              ...prev,
              isInCall: false,
              callStatus: 'ended',
              isCalling: false,
            }));
            stopTranscriptPolling();
            break;
            
          default:
            console.log('[useWebRTC] Unknown session state:', newState);
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
  }, [connect, extension, freeswitchWssUrl, locationId, agentId]);

  /**
   * End call
   */
  const endCall = useCallback(async () => {
    if (sessionRef.current) {
      // Only call bye() if session is in Established state
      if (sessionRef.current.state === SessionState.Established) {
        try {
          await sessionRef.current.bye();
        } catch (error: any) {
          // Silently handle errors if session is already terminated
          console.warn('[useWebRTC] Session termination failed:', error.message);
        }
      }
      sessionRef.current = null;
    }

    stopTranscriptPolling();

    setState(prev => ({
      ...prev,
      isInCall: false,
      callStatus: 'ended',
      isCalling: false,
    }));
  }, [stopTranscriptPolling]);

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
        // Only call bye() if session is in Established state
        if (sessionRef.current.state === SessionState.Established) {
          sessionRef.current.bye().catch((err: any) => {
            console.warn('[useWebRTC] Cleanup bye() failed:', err.message);
          });
        }
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

