/**
 * Test Call Page
 * WebRTC softphone for testing voice agent
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Phone, PhoneOff, Loader, MessageSquare, Mic, AlertCircle } from 'lucide-react';
import { apiClient } from '../services/apiClient.js';
import { Device } from '@twilio/voice-sdk';
import { toast } from '../components/ui/Toast.js';
import { useLocationId } from '../hooks/useAuth.js';
import { useDashboardOverview } from '../hooks/useDashboardOverview.js';

type TestMode = 'voice' | 'chat';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  toolCalls?: Array<{
    name: string;
    arguments: Record<string, unknown>;
    result?: unknown;
    error?: string;
  }>;
}

// Helper function (defined outside component)
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const TestCallPage: React.FC = () => {
  // 1. All useRef hooks first (stable references)
  const audioRef = useRef<HTMLAudioElement>(null);
  const chatCallSidRef = useRef<string | null>(null);

  // 2. All useState hooks
  const [activeTab, setActiveTab] = useState<TestMode>('voice');
  const [callDuration, setCallDuration] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChatMessage, setIsSendingChatMessage] = useState(false);
  const [twilioDevice, setTwilioDevice] = useState<Device | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'disconnected' | 'connecting' | 'connected'
  >('disconnected');
  const [callStatus, setCallStatus] = useState<'idle' | 'initiating' | 'in-progress' | 'error'>(
    'idle',
  );
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // 3. Custom hooks
  const locationId = useLocationId();
  const dashboardData = useDashboardOverview();
  const agentId = dashboardData.data?.agent_config?.id;

  // ÄNDERUNG 3: connectToVoice Funktion komplett ersetzen
  const connectToVoice = async () => {
    try {
      setIsInitializing(true);
      setConnectionStatus('connecting');
      setConnectionError(null);

      // Token vom Backend holen
      const response = await apiClient.get<{
        success: boolean;
        token: string;
        identity: string;
        appSid: string;
      }>('/test-call/voice-token');

      if (!response.data.success) {
        throw new Error('Token generation failed');
      }

      console.log('[TestCall] Received token for identity:', response.data.identity);

      // Twilio Device initialisieren
      const device = new Device(response.data.token, {
        logLevel: 'debug',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        codecPreferences: ['opus', 'pcmu'] as any,
        enableImprovedSignalingErrorPrecision: true,
      });

      // Event Listener
      device.on('registered', () => {
        console.log('[TestCall] Device registered successfully');
        setConnectionStatus('connected');
        setIsInitializing(false);
      });

      device.on('error', (error: { message: string }) => {
        console.error('[TestCall] Device error:', error);
        setConnectionError(`Twilio Device Error: ${error.message}`);
        setConnectionStatus('disconnected');
        setIsInitializing(false);
      });

      device.on('incoming', (call: { accept: () => void }) => {
        console.log('[TestCall] Incoming call received');
        call.accept();
        setCallStatus('in-progress');
      });

      // Device registrieren
      await device.register();
      setTwilioDevice(device);

      toast.success('Erfolgreich mit Twilio verbunden!');
    } catch (error) {
      const err = error as { message?: string };
      console.error('[TestCall] Connection error:', err);
      setConnectionError(err.message || 'Verbindung fehlgeschlagen');
      setConnectionStatus('disconnected');
      setIsInitializing(false);
      toast.error('Verbindung fehlgeschlagen: ' + err.message);
    }
  };

  // ÄNDERUNG 4: startCall Funktion hinzufügen
  const startCall = async () => {
    if (!twilioDevice) {
      toast.error('Nicht verbunden');
      return;
    }

    try {
      setCallStatus('initiating');

      // Anruf zum Voice Agent starten
      const call = await twilioDevice.connect({
        params: {
          To: 'agent', // Verbindet zu unserem Agent
          locationId: locationId || '', // Pass locationId to identify the agent config
        },
      });

      call.on('accept', () => {
        console.log('[TestCall] Call accepted');
        setCallStatus('in-progress');
        toast.success('Verbunden mit Voice Agent!');
      });

      call.on('disconnect', () => {
        console.log('[TestCall] Call disconnected');
        setCallStatus('idle');
        toast.info('Anruf beendet');
      });
    } catch (error) {
      const err = error as { message?: string };
      console.error('[TestCall] Call error:', err);
      setCallStatus('error');
      toast.error('Anruf fehlgeschlagen: ' + err.message);
    }
  };

  // ÄNDERUNG 5: Cleanup bei Unmount
  useEffect(() => {
    return () => {
      if (twilioDevice) {
        twilioDevice.destroy();
      }
    };
  }, [twilioDevice]);

  // 5. useEffect hooks
  useEffect(() => {
    if (callStatus === 'in-progress') {
      const interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCallDuration(0);
    }
  }, [callStatus]);

  // 6. Event handlers as regular async functions (no useCallback to avoid TDZ issues)
  async function sendChatMessage(): Promise<void> {
    if (!chatInput.trim() || !locationId || isSendingChatMessage) return;

    setIsSendingChatMessage(true);
    const messageText = chatInput.trim();

    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      text: messageText,
      timestamp: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput('');

    try {
      // Generate call_sid if not exists (use ref to avoid state timing issues)
      if (!chatCallSidRef.current) {
        chatCallSidRef.current = `chat_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      }
      const effectiveCallSid = chatCallSidRef.current;

      const response = await apiClient.post<{
        success: boolean;
        text: string;
        audio_url: string;
        toolCalls?: Array<{
          name: string;
          arguments: Record<string, unknown>;
          result?: unknown;
          error?: string;
        }>;
      }>('/v1/test-call/chat-message', {
        location_id: locationId,
        text: messageText,
        call_sid: effectiveCallSid,
      });

      if (response.data.success) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          text: response.data.text,
          timestamp: new Date().toISOString(),
          toolCalls: response.data.toolCalls,
        };
        setChatMessages((prev) => [...prev, assistantMessage]);

        // Play audio response
        if (response.data.audio_url && audioRef.current) {
          audioRef.current.src = response.data.audio_url;
          audioRef.current.play().catch((err) => {
            console.error('Failed to play audio:', err);
          });
        }
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } }; message?: string };
      console.error('[TestCallPage] Chat message error:', err);
      const errorMessage =
        err?.response?.data?.error || err?.message || 'Fehler beim Senden der Nachricht';
      const errorMsg: ChatMessage = {
        role: 'assistant',
        text: `Fehler: ${errorMessage}`,
        timestamp: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSendingChatMessage(false);
    }
  }

  function handleChatInputKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  }

  // 7. useMemo hooks
  const combinedTranscript = useMemo(() => {
    if (activeTab === 'voice') {
      return []; // Voice SDK transcript handling would go here if needed
    }
    return chatMessages.map((msg) => ({
      role: msg.role,
      text: msg.text,
      timestamp: msg.timestamp,
    }));
  }, [activeTab, chatMessages]);

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
            onClick={() => setActiveTab('voice')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'voice'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Mic className="w-4 h-4" />
            Voice
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'chat'
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

        {/* ÄNDERUNG 6: Voice Tab UI aktualisieren */}
        {activeTab === 'voice' && (
          <div className="space-y-4">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Mic size={24} className="text-primary" />
                <div>
                  <h3 className="text-lg font-semibold">Browser Voice Test</h3>
                  <p className="text-sm text-gray-400">
                    Teste den Agent direkt im Browser mit Twilio WebRTC
                  </p>
                </div>
              </div>

              {/* Status Anzeigen */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-900 p-4 rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">Verbindungsstatus:</div>
                  <div
                    className={`font-semibold ${
                      connectionStatus === 'connected'
                        ? 'text-green-400'
                        : connectionStatus === 'connecting'
                          ? 'text-yellow-400'
                          : 'text-red-400'
                    }`}
                  >
                    {connectionStatus === 'connected'
                      ? 'Verbunden'
                      : connectionStatus === 'connecting'
                        ? 'Verbinde...'
                        : 'Nicht verbunden'}
                  </div>
                </div>

                <div className="bg-slate-900 p-4 rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">Call Status:</div>
                  <div
                    className={`font-semibold ${
                      callStatus === 'in-progress'
                        ? 'text-green-400'
                        : callStatus === 'initiating'
                          ? 'text-yellow-400'
                          : callStatus === 'error'
                            ? 'text-red-400'
                            : 'text-gray-400'
                    }`}
                  >
                    {callStatus === 'in-progress'
                      ? `Aktiv (${formatDuration(callDuration)})`
                      : callStatus === 'initiating'
                        ? 'Startet...'
                        : callStatus === 'error'
                          ? 'Fehler'
                          : 'Bereit'}
                  </div>
                </div>
              </div>

              {/* Fehleranzeige */}
              {connectionError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-red-400 mt-0.5" size={20} />
                    <div>
                      <h3 className="text-sm font-semibold text-red-300 mb-1">
                        Verbindungsfehler:
                      </h3>
                      <p className="text-xs text-red-200/80">{connectionError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                {connectionStatus !== 'connected' ? (
                  <button
                    onClick={connectToVoice}
                    disabled={isInitializing}
                    className="flex-1 px-6 py-3 bg-primary text-black rounded-lg font-medium hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isInitializing ? (
                      <>
                        <Loader className="animate-spin" size={20} />
                        Verbinde...
                      </>
                    ) : (
                      <>
                        <Phone size={20} />
                        Mit Twilio Voice verbinden
                      </>
                    )}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={startCall}
                      disabled={callStatus !== 'idle'}
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Mic size={20} />
                      Anruf starten
                    </button>
                    <button
                      onClick={() => twilioDevice?.disconnectAll()}
                      className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <PhoneOff size={20} />
                      Trennen
                    </button>
                  </>
                )}
              </div>

              <p className="text-xs text-gray-400 mt-4">
                💡 Tipp: Stelle sicher, dass dein Browser Mikrofon-Zugriff hat
              </p>
            </div>
          </div>
        )}

        {/* Chat Mode: Input */}
        {activeTab === 'chat' && (
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
                  onClick={() => sendChatMessage()}
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
                const chatMessage = activeTab === 'chat' ? chatMessages[index] : null;
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
                          if (
                            toolCall.name === 'calendar' &&
                            toolCall.arguments?.action === 'create_appointment'
                          ) {
                            const args = toolCall.arguments as { action: string; summary?: string };
                            const result = toolCall.result as {
                              success: boolean;
                              data?: { start: string };
                            };
                            if (result?.success && result?.data) {
                              const event = result.data;
                              const startDate = new Date(event.start);
                              return (
                                <div key={toolIndex} className="text-xs text-green-400 mb-1">
                                  📅 Termin erstellt: {startDate.toLocaleString('de-CH')} -{' '}
                                  {args.summary || 'Termin'}
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
        {activeTab === 'voice' && callStatus === 'idle' && (
          <div className="mt-8 space-y-4">
            <div className="text-center text-gray-400 text-sm">
              <p>Verbinden Sie sich mit Twilio Voice und starten Sie einen Test-Call.</p>
              <p className="mt-2">Der Agent wird Ihre Sprache transkribieren und antworten.</p>
            </div>
          </div>
        )}

        {activeTab === 'chat' && chatMessages.length === 0 && (
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
