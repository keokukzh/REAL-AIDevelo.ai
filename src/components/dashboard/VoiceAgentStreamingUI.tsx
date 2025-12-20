import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Phone, PhoneOff, AlertCircle, Loader } from 'lucide-react';
import { useElevenLabsStreaming } from '../../hooks/useElevenLabsStreaming';

interface VoiceAgentStreamingUIProps {
  customerId: string;
  agentId: string;
  voiceId?: string;
  onClose?: () => void;
}

export function VoiceAgentStreamingUI({
  customerId,
  agentId,
  voiceId,
  onClose,
}: VoiceAgentStreamingUIProps) {
  const { 
    isConnected, 
    isListening, 
    isLoading,
    transcript, 
    error, 
    connect, 
    startListening, 
    stopListening, 
    disconnect 
  } = useElevenLabsStreaming({
    customerId,
    agentId,
    voiceId,
  });

  const [callActive, setCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const autoStartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track call duration
  useEffect(() => {
    if (!callActive) return;

    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [callActive]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartCall = async () => {
    try {
      // Start listening immediately to enable audio playback (required for browser autoplay policy)
      // This ensures the AudioContext is activated by user interaction
      await connect();
      setCallActive(true);
      setCallDuration(0);
      
      // Auto-start listening after a short delay to ensure WebSocket is ready
      // This allows the agent to speak immediately
      setTimeout(() => {
        startListening().catch((err) => {
          console.warn('[VoiceAgentStreamingUI] Auto-start listening failed (user can start manually):', err);
        });
      }, 500);
    } catch (err) {
      console.error('Failed to start call:', err);
    }
  };

  const handleEndCall = () => {
    // Clear auto-start timeout if still pending
    if (autoStartTimeoutRef.current) {
      clearTimeout(autoStartTimeoutRef.current);
      autoStartTimeoutRef.current = null;
    }
    
    stopListening();
    disconnect();
    setCallActive(false);
    setCallDuration(0);
    onClose?.();
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoStartTimeoutRef.current) {
        clearTimeout(autoStartTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
      {/* Call Duration Display */}
      {callActive && (
        <div className="mb-6 text-center">
          <div className="text-4xl font-bold text-blue-600 font-mono">
            {formatDuration(callDuration)}
          </div>
          <p className="text-sm text-gray-600 mt-1">Call in progress</p>
        </div>
      )}

      {/* Status Indicator */}
      <div className="mb-6 flex items-center gap-2">
        {isLoading ? (
          <div className="flex items-center gap-2 text-blue-600">
            <Loader className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">Connecting...</span>
          </div>
        ) : isConnected ? (
          <div className="flex items-center gap-2 text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Connected</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-500">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span className="text-sm font-medium">Disconnected</span>
          </div>
        )}
      </div>

      {/* Transcript Display */}
      {transcript && (
        <div className="mb-6 w-full max-w-md">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-600 font-medium mb-2">You said:</p>
            <p className="text-base text-gray-900 italic">"{transcript}"</p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 w-full max-w-md">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-700 font-semibold mb-1">Error:</p>
              <p className="text-sm text-red-700">{error}</p>
              {error.includes('Agent not found') && (
                <p className="text-xs text-red-600 mt-2">
                  💡 <strong>Tip:</strong> Go to Dashboard → Settings → Agent-Konfiguration to update the ElevenLabs Agent ID.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Microphone Activity Indicator */}
      {isListening && (
        <div className="mb-6 flex items-center justify-center gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-1.5 h-6 bg-gradient-to-t from-blue-400 to-blue-600 rounded-full animate-pulse"
              style={{
                animationDelay: `${i * 0.1}s`,
                animationDuration: '0.6s',
              }}
            ></div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-4">
        {!callActive ? (
          <button
            onClick={handleStartCall}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Phone className="w-4 h-4" />
                Start Call
              </>
            )}
          </button>
        ) : (
          <>
            <button
              onClick={isListening ? stopListening : startListening}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4" />
                  Stop Listening
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  Start Listening
                </>
              )}
            </button>

            <button
              onClick={handleEndCall}
              className="flex items-center gap-2 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition"
            >
              <PhoneOff className="w-4 h-4" />
              End Call
            </button>
          </>
        )}
      </div>

      {/* Help Text */}
      {!callActive && !isLoading && (
        <p className="mt-6 text-xs text-gray-600 text-center max-w-sm">
          Click "Start Call" to initiate a voice conversation with the AI agent. Your audio and 
          responses will be securely encrypted.
        </p>
      )}
    </div>
  );
}
