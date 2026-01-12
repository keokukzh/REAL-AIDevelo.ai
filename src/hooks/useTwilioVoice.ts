import { useState, useRef, useCallback } from 'react';
import { Device, Call } from '@twilio/voice-sdk';
import { apiClient } from '../services/apiClient';

export interface TwilioVoiceState {
  isConnected: boolean;
  isCalling: boolean;
  isInCall: boolean;
  callStatus: 'idle' | 'connecting' | 'ringing' | 'active' | 'ended' | 'error';
  error: string | null;
  transcript: Array<{ role: 'user' | 'assistant'; text: string; timestamp: string }>;
}

export interface UseTwilioVoiceOptions {
  locationId: string;
  agentId?: string;
  onTranscriptUpdate?: (
    transcript: Array<{ role: 'user' | 'assistant'; text: string; timestamp: string }>,
  ) => void;
}

export function useTwilioVoice(options: UseTwilioVoiceOptions) {
  const { locationId, agentId } = options;

  const [state, setState] = useState<TwilioVoiceState>({
    isConnected: false,
    isCalling: false,
    isInCall: false,
    callStatus: 'idle',
    error: null,
    transcript: [],
  });

  const deviceRef = useRef<Device | null>(null);
  const callRef = useRef<Call | null>(null);

  const connect = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isCalling: false, error: null }));

      const response = await apiClient.post<{ token: string }>('/phone/token', {
        identity: `user_${locationId}`,
      });
      const token = response.data.token;

      const device = new Device(token, {
        logLevel: 1,
        codecPreferences: [Call.Codec.PCMU, Call.Codec.Opus],
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      device.on('error', (err: any) => {
        console.error('Twilio Device Error:', err);
        setState((prev) => ({ ...prev, error: err.message, callStatus: 'error' }));
      });

      device.on('registered', () => {
        console.log('Twilio Device Registered');
        setState((prev) => ({ ...prev, isConnected: true }));
      });

      await device.register();
      deviceRef.current = device;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Setup failed:', err);
      setState((prev) => ({ ...prev, error: err.message || 'Setup failed' }));
    }
  }, [locationId]);

  const startCall = useCallback(async () => {
    if (!deviceRef.current) {
      await connect();
    }

    if (deviceRef.current) {
      try {
        setState((prev) => ({ ...prev, isCalling: true, callStatus: 'connecting' }));

        // Connect using Twilio Device
        // We pass params that will be sent to the TwiML App
        const call = await deviceRef.current.connect({
          params: {
            To: '+19522951346',
            AgentId: agentId || '',
            LocationId: locationId,
          },
        });

        callRef.current = call;

        call.on('accept', () => {
          setState((prev) => ({ ...prev, isInCall: true, callStatus: 'active', isCalling: false }));
        });

        call.on('disconnect', () => {
          setState((prev) => ({ ...prev, isInCall: false, callStatus: 'ended', isCalling: false }));
          callRef.current = null;
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        call.on('error', (err: any) => {
          console.error('Call Error:', err);
          setState((prev) => ({ ...prev, callStatus: 'error', error: err.message }));
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error('Connect failed:', err);
        setState((prev) => ({
          ...prev,
          error: err.message,
          callStatus: 'error',
          isCalling: false,
        }));
      }
    }
  }, [agentId, locationId, connect]);

  const endCall = useCallback(() => {
    if (callRef.current) {
      callRef.current.disconnect();
    }
    if (deviceRef.current) {
      deviceRef.current.disconnectAll();
    }
  }, []);

  const disconnect = useCallback(() => {
    endCall();
    if (deviceRef.current) {
      deviceRef.current.destroy();
      deviceRef.current = null;
    }
    setState((prev) => ({ ...prev, isConnected: false, callStatus: 'idle' }));
  }, [endCall]);

  return {
    ...state,
    connect,
    startCall,
    endCall,
    disconnect,
  };
}
