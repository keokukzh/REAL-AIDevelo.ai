/**
 * Test Call Page
 * WebRTC softphone for testing voice agent
 */

import React, { useState, useEffect, useRef } from 'react';
import { useWebRTC } from '../hooks/useWebRTC';
import { useLocationId } from '../hooks/useAuth';
import { useDashboardOverview } from '../hooks/useDashboardOverview';
import { Phone, PhoneOff, Loader, MessageSquare, Mic } from 'lucide-react';
import { apiClient } from '../services/apiClient';

type TestMode = 'voice' | 'chat';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  toolCalls?: Array<{
    name: string;
    arguments: any;
    result?: any;
    error?: string;
  }>;
}

export const TestCallPage: React.FC = () => {
  const locationId = useLocationId();
  const { data: overview } = useDashboardOverview();
  const agentId = overview?.agent_config?.id;

  const [mode, setMode] = useState<TestMode>('voice');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChatMessage, setIsSendingChatMessage] = useState(false);
  const [chatCallSid, setChatCallSid] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const {
    isConnected,
    isCalling,
    isInCall,
    callStatus,
    error,
    transcript,
    connect,
    startCall,
    endCall,
    disconnect,
  } = useWebRTC({
    locationId: locationId || '',
    agentId,
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    if (isInCall) {
      const interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCallDuration(0);
    }
  }, [isInCall]);

  // Handle chat message
  const handleChatMessage = async (text: string) => {
    if (!text.trim() || !locationId || isSendingChatMessage) return;

    setIsSendingChatMessage(true);

    // Add user message to chat
    const userMessage: ChatMessage = {
      role: 'user',
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');

    try {
      // Generate call_sid if not exists (use local variable, not state)
      const effectiveCallSid = chatCallSid || `chat_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      // Update state for next message
      if (!chatCallSid) {
        setChatCallSid(effectiveCallSid);
      }

      const response = await apiClient.post<{
        success: boolean;
        text: string;
        audio_url: string;
        toolCalls?: Array<{
          name: string;
          arguments: any;
          result?: any;
          error?: string;
        }>;
      }>('/v1/test-call/chat-message', {
        location_id: locationId,
        text: text.trim(),
        call_sid: effectiveCallSid,
      });

      if (response.data.success) {
        // Add assistant message
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          text: response.data.text,
          timestamp: new Date().toISOString(),
          toolCalls: response.data.toolCalls,
        };
        setChatMessages(prev => [...prev, assistantMessage]);

        // Play audio response
        if (response.data.audio_url && audioRef.current) {
          audioRef.current.src = response.data.audio_url;
          audioRef.current.play().catch(err => {
            console.error('Failed to play audio:', err);
          });
        }
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error: any) {
      console.error('[TestCallPage] Chat message error:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Fehler beim Senden der Nachricht';
      
      // Add error message
      const errorMsg: ChatMessage = {
        role: 'assistant',
        text: `Fehler: ${errorMessage}`,
        timestamp: new Date().toISOString(),
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsSendingChatMessage(false);
    }
  };

  // Handle Enter key in chat input
  const handleChatInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChatMessage(chatInput);
    }
  };

  // Get combined transcript (voice or chat)
  const combinedTranscript = mode === 'voice' ? transcript : chatMessages.map(msg => ({
    role: msg.role,
    text: msg.text,
    timestamp: msg.timestamp,
  }));

  // Render main action button based on connection and call state
  const renderMainButton = () => {
    if (!isConnected) {
      return (
        <button
          onClick={connect}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition"
        >
          <Phone className="w-4 h-4" />
          Mit FreeSWITCH verbinden
        </button>
      );
    }

    if (!isInCall) {
      return (
        <button
          onClick={startCall}
          disabled={isCalling}
          className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCalling ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Verbinde...
            </>
          ) : (
            <>
              <Phone className="w-4 h-4" />
              Test Call starten
            </>
          )}
        </button>
      );
    }

    return (
      <button
        onClick={endCall}
        className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition"
      >
        <PhoneOff className="w-4 h-4" />
        Call beenden
      </button>
    );
  };

  if (!locationId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Bitte melden Sie sich an, um Test-Calls zu nutzen.</p>
        </div>
      </div>
    );
  }

  if (!agentId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-gray-400 mb-4">Agent-Konfiguration wird geladen...</p>
          <p className="text-sm text-gray-500">Bitte warten Sie einen Moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">Test Call - Voice Agent</h1>

        {/* Mode Toggle */}
        <div className="flex gap-2 justify-center mb-6">
          <button
            onClick={() => setMode('voice')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              mode === 'voice'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Mic className="w-4 h-4" />
            Voice
          </button>
          <button
            onClick={() => setMode('chat')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              mode === 'chat'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Chat
          </button>
        </div>

        {/* Hidden audio element for chat mode */}
        <audio ref={audioRef} className="hidden" />

        {/* Voice Mode: Connection Status & Controls */}
        {mode === 'voice' && (
          <>
            <div className="bg-white/5 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400">Verbindungsstatus:</span>
                <span className={`font-semibold ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
                  {isConnected ? 'Verbunden' : 'Nicht verbunden'}
                </span>
              </div>

              {callStatus !== 'idle' && (
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-400">Call Status:</span>
                  <span className="font-semibold text-blue-500">
                    {callStatus === 'connecting' && 'Verbinde...'}
                    {callStatus === 'ringing' && 'Klingelt...'}
                    {callStatus === 'active' && `Aktiv (${formatDuration(callDuration)})`}
                    {callStatus === 'ended' && 'Beendet'}
                    {callStatus === 'error' && 'Fehler'}
                  </span>
                </div>
              )}

              {error && (
                <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-sm">
                  <div className="font-semibold mb-2">Verbindungsfehler:</div>
                  <div className="mb-2">{error}</div>
                  <div className="text-xs text-red-300/80 mt-2">
                    <p>Hinweis: FreeSWITCH muss auf dem konfigurierten Server laufen.</p>
                    <p>Für lokale Tests: Stellen Sie sicher, dass FreeSWITCH auf localhost:7443 läuft.</p>
                    <p>Für Production: FreeSWITCH muss auf dem konfigurierten Host erreichbar sein.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex gap-4 justify-center mb-8">
              {renderMainButton()}

              {isConnected && (
                <button
                  onClick={disconnect}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition"
                >
                  Trennen
                </button>
              )}
            </div>
          </>
        )}

        {/* Chat Mode: Input */}
        {mode === 'chat' && (
          <div className="bg-white/5 rounded-lg p-6 mb-6">
            <div className="space-y-4">
              <div className="flex gap-2">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleChatInputKeyDown}
                  placeholder="Schreiben Sie Ihre Nachricht... (Enter zum Senden, Shift+Enter für neue Zeile)"
                  className="flex-1 bg-gray-800 text-white rounded-lg p-3 border border-gray-700 focus:border-blue-500 focus:outline-none resize-none"
                  rows={3}
                  disabled={isSendingChatMessage || !locationId}
                />
                <button
                  onClick={() => handleChatMessage(chatInput)}
                  disabled={!chatInput.trim() || isSendingChatMessage || !locationId}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSendingChatMessage ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Sende...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4" />
                      Senden
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-400">
                💡 Der Agent antwortet immer im Voice-Modus (Text + Audio)
              </p>
            </div>
          </div>
        )}

        {/* Transcript */}
        {combinedTranscript.length > 0 && (
          <div className="bg-white/5 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Transkript</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {combinedTranscript.map((entry, index) => {
                // Get tool calls for chat messages
                const chatMessage = mode === 'chat' ? chatMessages[index] : null;
                const toolCalls = chatMessage?.toolCalls;

                return (
                  <div
                    key={`${entry.timestamp}-${index}`}
                    className={`p-3 rounded ${
                      entry.role === 'user'
                        ? 'bg-blue-500/20 border-l-4 border-blue-500'
                        : 'bg-green-500/20 border-l-4 border-green-500'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-400 uppercase">
                        {entry.role === 'user' ? 'Sie' : 'Agent'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-white">{entry.text}</p>
                    
                    {/* Tool Calls Display */}
                    {toolCalls && toolCalls.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <div className="text-xs font-semibold text-gray-400 mb-2">Aktionen:</div>
                        {toolCalls.map((toolCall, toolIndex) => {
                          if (toolCall.error) {
                            return (
                              <div key={toolIndex} className="text-xs text-red-400 mb-1">
                                ❌ {toolCall.name}: {toolCall.error}
                              </div>
                            );
                          }

                          // Format calendar appointment
                          if (toolCall.name === 'calendar' && toolCall.arguments?.action === 'create_appointment') {
                            const args = toolCall.arguments;
                            const result = toolCall.result as any;
                            if (result?.success && result?.data) {
                              const event = result.data;
                              const startDate = new Date(event.start);
                              return (
                                <div key={toolIndex} className="text-xs text-green-400 mb-1">
                                  📅 Termin erstellt: {startDate.toLocaleString('de-CH')} - {args.summary || 'Termin'}
                                </div>
                              );
                            }
                          }

                          // Generic tool call display
                          return (
                            <div key={toolIndex} className="text-xs text-green-400 mb-1">
                              ✅ {toolCall.name} ausgeführt
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Help Text */}
        {mode === 'voice' && !isInCall && (
          <div className="mt-8 space-y-4">
            <div className="text-center text-gray-400 text-sm">
              <p>Verbinden Sie sich mit FreeSWITCH und starten Sie einen Test-Call.</p>
              <p className="mt-2">Der Agent wird Ihre Sprache transkribieren und antworten.</p>
            </div>
            
            {/* Info Box for Production */}
            {import.meta.env.PROD && !isConnected && (
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded text-yellow-300 text-sm">
                <div className="font-semibold mb-2">⚠️ FreeSWITCH in Production</div>
                <p className="text-xs text-yellow-200/80">
                  FreeSWITCH ist für Production noch nicht eingerichtet. 
                  Für lokale Tests können Sie FreeSWITCH mit <code className="bg-yellow-500/20 px-1 rounded">docker-compose up freeswitch</code> starten.
                </p>
                <p className="text-xs text-yellow-200/80 mt-2">
                  Die WebRTC-Test-Funktion ist derzeit nur für lokale Entwicklung verfügbar.
                </p>
              </div>
            )}
          </div>
        )}

        {mode === 'chat' && chatMessages.length === 0 && (
          <div className="mt-8 space-y-4">
            <div className="text-center text-gray-400 text-sm">
              <p>Schreiben Sie eine Nachricht an den Agent.</p>
              <p className="mt-2">Der Agent antwortet im Voice-Modus (Text + Audio).</p>
              <p className="mt-2 text-xs text-gray-500">
                Der Agent kann Termine erstellen, Fragen beantworten und mehr.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

