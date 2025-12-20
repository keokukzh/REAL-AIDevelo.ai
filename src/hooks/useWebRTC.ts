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
          setFreeswitchConfig(response.data.config);
        } else {
          throw new Error('Invalid config response');
        }
      } catch (error) {
        console.error('[useWebRTC] Failed to fetch FreeSWITCH config:', error);
        // Fallback to defaults
        setFreeswitchConfig({
          wss_url: import.meta.env.VITE_FREESWITCH_WSS_URL || 'wss://localhost:7443',
          sip_username: `test_${locationId}`,
          sip_password: 'test123',
          extension: '1000',
        });
      }
    };
    fetchConfig();
  }, [locationId]);

  const freeswitchWssUrl = freeswitchConfig?.wss_url || 'wss://localhost:7443';
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
      const hostname = freeswitchWssUrl.replace(/^wss?:\/\//, '').split(':')[0];
      const port = freeswitchWssUrl.match(/:(\d+)/)?.[1] || '7443';

      // Create UserAgent
      const userAgent = new UserAgent({
        uri: UserAgent.makeURI(`sip:${sipUsername}@${hostname}:${port}`),
        transportOptions: {
          server: freeswitchWssUrl,
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

      // Connect
      await userAgent.start();

      // Register
      const registerer = new Registerer(userAgent);
      registererRef.current = registerer;

      await registerer.register();

      setState(prev => ({
        ...prev,
        isConnected: true,
        callStatus: 'idle',
      }));
    } catch (error: any) {
      console.error('[useWebRTC] Connect error:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to connect to FreeSWITCH',
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
      const targetURI = UserAgent.makeURI(`sip:${extension}@${freeswitchWssUrl.replace('wss://', '')}`);

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

