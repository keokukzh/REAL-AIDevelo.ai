import { useEffect, useRef, useState, useCallback } from 'react';
import { apiRequest } from '../services/api';
import { logger } from '../lib/logger';

interface StreamConfig {
  customerId: string;
  agentId: string;
  voiceId?: string;
  duration?: number;
  conversationInitData?: any; // conversation_initiation_client_data from backend
}

interface StreamMessage {
  type: 'conversation_initiation' | 'conversation_initiation_metadata' | 'audio' | 'audio_out' | 'user_transcript' | 'agent_response' | 'server_mid' | 'client_mid';
  [key: string]: any;
}

export function useElevenLabsStreaming(config: StreamConfig) {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const micStreamRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const reconnectAttemptRef = useRef(0);

  // Get WebSocket URL from backend
  const getStreamUrl = useCallback(async () => {
    try {
      const response = await apiRequest<{ data: { wsUrl: string; agentId: string; customerId: string; voiceId?: string; conversation_initiation_client_data?: any } }>('/voice-agent/elevenlabs-stream-token', {
        method: 'POST',
        data: {
          customerId: config.customerId,
          agentId: config.agentId,
          voiceId: config.voiceId,
        },
      });
      
      // Store the actual ElevenLabs agent ID and conversation init data
      if (response.data.agentId) {
        (config as any).elevenAgentId = response.data.agentId;
      }
      if (response.data.conversation_initiation_client_data) {
        (config as any).conversationInitData = response.data.conversation_initiation_client_data;
      }
      
      return response.data.wsUrl;
    } catch (err: any) {
      logger.error('[ElevenLabs] Failed to get stream URL', err instanceof Error ? err : new Error(String(err)));
      
      // Check if it's an "Agent not found" error from backend
      if (err?.response?.data?.error === 'Agent not found' || err?.response?.status === 404) {
        const errorMessage = err?.response?.data?.message || err?.response?.data?.error || 'Agent not found';
        throw new Error(errorMessage);
      }
      
      throw new Error(`Failed to get stream URL: ${err?.response?.data?.message || err?.message || String(err)}`);
    }
  }, [config]);

  // Initialize WebSocket connection
  const connect = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      const wsUrl = await getStreamUrl();

      // Connect to ElevenLabs WebSocket
      const ws = new WebSocket(wsUrl);

      ws.onopen = async () => {
        logger.debug('[ElevenLabs] WebSocket connected');
        setIsConnected(true);
        setIsLoading(false);
        reconnectAttemptRef.current = 0;
        
        // Initialize AudioContext immediately (required for browser autoplay policy)
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        
        // Resume AudioContext if suspended (required for autoplay)
        if (audioContextRef.current.state === 'suspended') {
          try {
            await audioContextRef.current.resume();
            logger.debug('[ElevenLabs] AudioContext resumed on connection');
          } catch (resumeError) {
            logger.warn('[ElevenLabs] Could not resume AudioContext (may require user interaction)', resumeError instanceof Error ? resumeError : new Error(String(resumeError)));
          }
        }
        
        // Send conversation_initiation_client_data immediately after connection
        // This ensures browser test parity with phone calls (same dynamic variables, greeting, etc.)
        const initData = (config as any).conversationInitData;
        if (initData && ws.readyState === WebSocket.OPEN) {
          try {
            // Ensure proper message format for ElevenLabs
            const initMessage = {
              type: 'conversation_initiation_client_data',
              ...initData,
            };
            
            ws.send(JSON.stringify(initMessage));
            logger.debug('[ElevenLabs] Sent conversation_initiation_client_data', {
              hasDynamicVars: !!initData.dynamic_variables,
              hasConfigOverride: !!initData.conversation_config_override,
              messageType: initMessage.type,
            });
          } catch (initError) {
            logger.error('[ElevenLabs] Failed to send conversation_initiation_client_data', initError instanceof Error ? initError : new Error(String(initError)));
            // Continue anyway - agent will use defaults
          }
        } else {
          logger.debug('[ElevenLabs] No conversation_initiation_client_data available, using agent defaults');
        }
        
        logger.debug('[ElevenLabs] WebSocket connected, ready for conversation');
      };

      ws.onmessage = (event) => {
        if (event.data instanceof Blob) {
          handleAudioMessage(event.data);
        } else {
          try {
            const message = JSON.parse(event.data) as StreamMessage;
            handleMessage(message);
          } catch (err) {
            logger.error('[ElevenLabs] Failed to parse message', err instanceof Error ? err : new Error(String(err)));
          }
        }
      };

      ws.onerror = (event) => {
        // Try to get more details about the error
        const errorTarget = event.target as WebSocket;
        const errorMessage = (event as any).message || 
                           (errorTarget?.readyState === WebSocket.CLOSED ? 'Connection closed unexpectedly' : 
                           errorTarget?.readyState === WebSocket.CONNECTING ? 'Connection failed' : 
                           'WebSocket connection error');
        
        // Log additional details
        logger.error('[ElevenLabs] WebSocket error', new Error(errorMessage), {
          readyState: errorTarget?.readyState,
          url: wsUrl.substring(0, 100), // Truncate URL for security
          error: String(event),
        });
        
        setError(`WebSocket connection error: ${errorMessage}`);
        setIsConnected(false);
        setIsLoading(false);
      };

      ws.onclose = (event) => {
        logger.debug('[ElevenLabs] WebSocket closed', { code: event.code, reason: event.reason, wasClean: event.wasClean });
        setIsConnected(false);
        setIsListening(false);
        
        // Handle specific ElevenLabs error codes
        if (event.code === 3000) {
          // Agent does not exist
          const agentId = (config as any).elevenAgentId || 'unknown';
          const errorMessage = event.reason 
            ? `Agent not found: ${event.reason}. Agent ID: ${agentId}. Please verify the Agent ID in Settings (Dashboard → Settings → Agent-Konfiguration) or check your ElevenLabs dashboard.`
            : `Agent not found: The AI agent you are trying to reach does not exist. Agent ID: ${agentId}. Please verify the Agent ID in Settings or contact support.`;
          setError(errorMessage);
          logger.error('[ElevenLabs] Agent not found error', new Error('Agent not found'), {
            agentId,
            code: event.code,
            reason: event.reason,
            wsUrl: wsUrl.substring(0, 100) + '...',
          });
          return;
        }
        
        if (event.code === 4001 || event.code === 4003) {
          // Authentication or authorization error
          setError(`Authentication failed: ${event.reason || 'Invalid API key or insufficient permissions.'}`);
          return;
        }
        
        // Don't reconnect if it was a clean close or an authentication error
        if (event.code === 1000 || event.code === 1008 || event.code === 4001) {
          if (event.code !== 1000) {
            setError(`Connection closed: ${event.reason || 'Authentication or configuration error'}`);
          }
          return;
        }
        
        // Attempt reconnect with exponential backoff
        if (reconnectAttemptRef.current < 3) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptRef.current), 10000);
          setTimeout(() => {
            reconnectAttemptRef.current++;
            connect();
          }, delay);
        } else {
          setError(`Connection failed after multiple attempts: ${event.reason || 'Please check your configuration.'}`);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection failed';
      setError(message);
      setIsConnected(false);
      setIsLoading(false);
    }
  }, [getStreamUrl]);

  // Handle incoming audio from ElevenLabs
  const handleAudioMessage = useCallback(async (audioBlob: Blob) => {
    // Ensure AudioContext is created and resumed (required for browser autoplay policy)
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const audioContext = audioContextRef.current;
    
    // Resume AudioContext if suspended (required for autoplay)
    if (audioContext.state === 'suspended') {
      try {
        await audioContext.resume();
        logger.debug('[ElevenLabs] AudioContext resumed');
      } catch (resumeError) {
        logger.error('[ElevenLabs] Failed to resume AudioContext', resumeError instanceof Error ? resumeError : new Error(String(resumeError)));
      }
    }

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Play audio
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start(0);
        
        logger.debug('[ElevenLabs] Audio played', {
          duration: audioBuffer.duration,
          sampleRate: audioBuffer.sampleRate,
        });
      } catch (err) {
        logger.error('[ElevenLabs] Failed to play audio', err instanceof Error ? err : new Error(String(err)));
      }
    };

    reader.onerror = (error) => {
      logger.error('[ElevenLabs] FileReader error', error instanceof Error ? error : new Error(String(error)));
    };

    reader.readAsArrayBuffer(audioBlob);
  }, []);

  // Handle text messages from ElevenLabs
  const handleMessage = useCallback((message: StreamMessage) => {
    switch (message.type) {
      case 'conversation_initiation':
      case 'conversation_initiation_metadata':
        logger.debug('[ElevenLabs] Conversation initialized', {
          conversationId: (message as any).conversation_id,
          agentOutputFormat: (message as any).agent_output_audio_format,
          userInputFormat: (message as any).user_input_audio_format,
        });
        break;

      case 'user_transcript':
        setTranscript(message.transcript || '');
        logger.debug('[ElevenLabs] User transcript', { transcript: message.transcript });
        break;

      case 'agent_response':
        logger.debug('[ElevenLabs] Agent response', { response: (message as any).response });
        break;

      case 'server_mid':
        logger.debug('[ElevenLabs] Server MID', { mid: message.mid });
        break;

      case 'audio':
        // Handle base64-encoded audio (alternative format)
        if ((message as any).audio) {
          try {
            const audioData = atob((message as any).audio);
            const arrayBuffer = new ArrayBuffer(audioData.length);
            const view = new Uint8Array(arrayBuffer);
            for (let i = 0; i < audioData.length; i++) {
              view[i] = audioData.charCodeAt(i);
            }
            const blob = new Blob([arrayBuffer], { type: 'audio/pcm' });
            handleAudioMessage(blob);
          } catch (audioError) {
            logger.error('[ElevenLabs] Failed to decode base64 audio', audioError instanceof Error ? audioError : new Error(String(audioError)));
          }
        }
        break;

      default:
        logger.debug('[ElevenLabs] Message', { type: message.type, message });
    }
  }, [handleAudioMessage]);

  // Start microphone input
  const startListening = useCallback(async () => {
    try {
      setError(null);

      // Ensure AudioContext is created and resumed first (required for audio playback)
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 16000,
        });
      }

      const audioContext = audioContextRef.current;
      
      // Resume AudioContext if suspended (required for autoplay)
      if (audioContext.state === 'suspended') {
        try {
          await audioContext.resume();
          logger.debug('[ElevenLabs] AudioContext resumed for microphone');
        } catch (resumeError) {
          logger.warn('[ElevenLabs] Could not resume AudioContext', resumeError instanceof Error ? resumeError : new Error(String(resumeError)));
        }
      }

      // Check if microphone permission is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access not available. Please check browser permissions.');
      }

      if (!mediaStreamRef.current) {
        try {
          mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: 16000, // Match ElevenLabs expected format
            },
          });
        } catch (mediaError: any) {
          if (mediaError.name === 'NotAllowedError' || mediaError.name === 'PermissionDeniedError') {
            throw new Error('Microphone permission denied. Please allow microphone access in your browser settings.');
          } else if (mediaError.name === 'NotFoundError' || mediaError.name === 'DevicesNotFoundError') {
            throw new Error('No microphone found. Please connect a microphone and try again.');
          } else {
            throw new Error(`Microphone access failed: ${mediaError.message || mediaError.name}`);
          }
        }
      }

      const mediaStream = mediaStreamRef.current;

      // Create audio processing chain
      micStreamRef.current = audioContext.createMediaStreamSource(mediaStream);

      // Create processor for microphone input
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);

        // Send audio to WebSocket
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          // Convert Float32Array to Int16Array (PCM format expected by ElevenLabs)
          const int16Array = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            // Clamp to [-1, 1] and convert to 16-bit integer
            const s = Math.max(-1, Math.min(1, inputData[i]));
            int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }
          
          // Convert to base64 for transmission
          const base64Audio = btoa(
            String.fromCharCode.apply(null, Array.from(int16Array) as any)
          );
          
          wsRef.current.send(
            JSON.stringify({
              type: 'audio',
              audio: base64Audio,
            })
          );
        }
      };

      processorRef.current = processor;
      micStreamRef.current.connect(processor);
      processor.connect(audioContext.destination);

      setIsListening(true);
      logger.debug('[ElevenLabs] Microphone listening started');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to access microphone';
      setError(message);
      setIsListening(false);
      logger.error('[ElevenLabs] Failed to start listening', err instanceof Error ? err : new Error(String(err)));
    }
  }, []);

  // Stop microphone input
  const stopListening = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (micStreamRef.current) {
      micStreamRef.current.disconnect();
      micStreamRef.current = null;
    }

    setIsListening(false);
  }, []);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    stopListening();

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setTranscript('');
    setError(null);
  }, [stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isListening,
    isLoading,
    transcript,
    error,
    connect,
    startListening,
    stopListening,
    disconnect,
  };
}
