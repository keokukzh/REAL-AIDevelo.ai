import { useEffect, useRef, useState, useCallback } from 'react';
import { apiRequest } from '../services/api';

interface StreamConfig {
  customerId: string;
  agentId: string;
  voiceId?: string;
  duration?: number;
}

interface StreamMessage {
  type: 'conversation_initiation' | 'audio_out' | 'user_transcript' | 'server_mid' | 'client_mid';
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

  // Get WebSocket token from backend
  const getStreamToken = useCallback(async () => {
    try {
      const response = await apiRequest<{ data: { token: string } }>('/voice-agent/elevenlabs-stream-token', {
        method: 'POST',
        data: {
          customerId: config.customerId,
          agentId: config.agentId,
          voiceId: config.voiceId,
          duration: config.duration || 3600,
        },
      });
      return response.data.token;
    } catch (err) {
      throw new Error(`Failed to get stream token: ${err}`);
    }
  }, [config]);

  // Initialize WebSocket connection
  const connect = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      const token = await getStreamToken();

      // Connect to ElevenLabs WebSocket
      const ws = new WebSocket(`wss://api.elevenlabs.io/v1/convai?token=${token}`);

      ws.onopen = () => {
        console.log('[ElevenLabs] WebSocket connected');
        setIsConnected(true);
        setIsLoading(false);
        reconnectAttemptRef.current = 0;
      };

      ws.onmessage = (event) => {
        if (event.data instanceof Blob) {
          handleAudioMessage(event.data);
        } else {
          try {
            const message = JSON.parse(event.data) as StreamMessage;
            handleMessage(message);
          } catch (err) {
            console.error('[ElevenLabs] Failed to parse message:', err);
          }
        }
      };

      ws.onerror = (event) => {
        console.error('[ElevenLabs] WebSocket error:', event);
        setError('WebSocket connection error');
        setIsConnected(false);
        setIsLoading(false);
      };

      ws.onclose = () => {
        console.log('[ElevenLabs] WebSocket closed');
        setIsConnected(false);
        setIsListening(false);
        // Attempt reconnect with exponential backoff
        if (reconnectAttemptRef.current < 3) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptRef.current), 10000);
          setTimeout(() => {
            reconnectAttemptRef.current++;
            connect();
          }, delay);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection failed';
      setError(message);
      setIsConnected(false);
      setIsLoading(false);
    }
  }, [getStreamToken]);

  // Handle incoming audio from ElevenLabs
  const handleAudioMessage = useCallback((audioBlob: Blob) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const audioContext = audioContextRef.current;
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
      } catch (err) {
        console.error('[ElevenLabs] Failed to play audio:', err);
      }
    };

    reader.readAsArrayBuffer(audioBlob);
  }, []);

  // Handle text messages from ElevenLabs
  const handleMessage = useCallback((message: StreamMessage) => {
    switch (message.type) {
      case 'conversation_initiation':
        console.log('[ElevenLabs] Conversation initialized');
        break;

      case 'user_transcript':
        setTranscript(message.transcript || '');
        break;

      case 'server_mid':
        console.log('[ElevenLabs] Server MID:', message.mid);
        break;

      default:
        console.log('[ElevenLabs] Message:', message.type);
    }
  }, []);

  // Start microphone input
  const startListening = useCallback(async () => {
    try {
      setError(null);

      if (!mediaStreamRef.current) {
        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 16000,
        });
      }

      const audioContext = audioContextRef.current;
      const mediaStream = mediaStreamRef.current;

      // Create audio processing chain
      micStreamRef.current = audioContext.createMediaStreamSource(mediaStream);

      // Create processor for microphone input
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);

        // Send audio to WebSocket
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          // Convert to base64 for transmission
          const audioData = new Uint8Array(
            inputData.length > 0 ? inputData : new Float32Array(1)
          );
          wsRef.current.send(
            JSON.stringify({
              type: 'user_audio',
              audio: btoa(String.fromCharCode.apply(null, Array.from(audioData) as any)),
            })
          );
        }
      };

      processorRef.current = processor;
      micStreamRef.current.connect(processor);
      processor.connect(audioContext.destination);

      setIsListening(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to access microphone';
      setError(message);
      setIsListening(false);
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
