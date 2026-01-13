import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { AlertCircle, MessageSquare, Loader, Send, Volume2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { toast } from '../ui/Toast';

interface AgentTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentConfigId?: string;
  locationId?: string;
  adminTestNumber?: string | null;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  audioUrl?: string;
}

export const AgentTestModal: React.FC<AgentTestModalProps> = ({
  isOpen,
  onClose,
  agentConfigId,
  locationId,
}) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [callSid] = useState(`test_${Date.now()}_${Math.random().toString(36).substring(7)}`);
  const audioRef = useRef<HTMLAudioElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if we have the required data for testing
  const canTest = !!locationId && !!agentConfigId;

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setChatMessages([]);
      setChatInput('');
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!chatInput.trim() || !locationId || isSending) return;

    setIsSending(true);
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
      const response = await apiClient.post<{
        success: boolean;
        text: string;
        audio_url?: string;
      }>('/v1/test-call/chat-message', {
        location_id: locationId,
        text: messageText,
        call_sid: callSid,
      });

      if (response.data.success) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          text: response.data.text,
          timestamp: new Date().toISOString(),
          audioUrl: response.data.audio_url,
        };
        setChatMessages((prev) => [...prev, assistantMessage]);

        // Play audio response if available
        if (response.data.audio_url && audioRef.current) {
          audioRef.current.src = response.data.audio_url;
          audioRef.current.play().catch((err) => {
            console.error('Failed to play audio:', err);
          });
        }
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error: any) {
      console.error('[AgentTestModal] Chat message error:', error);
      const errorMessage =
        error?.response?.data?.error || error?.message || 'Fehler beim Senden der Nachricht';
      const errorMsg: ChatMessage = {
        role: 'assistant',
        text: `Fehler: ${errorMessage}`,
        timestamp: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, errorMsg]);
      toast.error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleClose = () => {
    setChatMessages([]);
    setChatInput('');
    onClose();
  };

  const playAudio = (audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play().catch((err) => {
        console.error('Failed to play audio:', err);
        toast.error('Fehler beim Abspielen der Audio');
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Agent testen - Chat Modus" size="lg">
      <audio ref={audioRef} className="hidden" />

      <div className="space-y-4">
        {!canTest ? (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-yellow-400 mt-0.5" size={20} />
            <div>
              <h3 className="text-sm font-semibold text-yellow-300 mb-1">
                Agent-Konfiguration fehlt
              </h3>
              <p className="text-xs text-yellow-200/80">
                Bitte vervollständige zuerst die Agent-Konfiguration, um den Agent testen zu können.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex items-start gap-2">
              <MessageSquare className="text-blue-400 mt-0.5" size={16} />
              <div>
                <p className="text-xs text-blue-200">
                  Teste deinen Voice Agent im Chat-Modus. Der Agent antwortet mit Text und Audio.
                </p>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 h-96 flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-gray-400 text-sm py-8">
                    <p>Schreibe eine Nachricht, um den Voice Agent zu testen.</p>
                    <p className="text-xs mt-2 text-gray-500">
                      Der Agent wird mit Text und Audio antworten.
                    </p>
                  </div>
                ) : (
                  chatMessages.map((msg, index) => (
                    <div
                      key={`${msg.timestamp}-${index}`}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.role === 'user' ? 'bg-accent text-black' : 'bg-gray-700 text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-semibold uppercase opacity-70">
                            {msg.role === 'user' ? 'Du' : 'Agent'}
                          </span>
                          {msg.audioUrl && msg.role === 'assistant' && (
                            <button
                              onClick={() => playAudio(msg.audioUrl!)}
                              className="text-xs flex items-center gap-1 hover:opacity-80"
                              title="Audio abspielen"
                            >
                              <Volume2 size={14} />
                            </button>
                          )}
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                        <span className="text-xs opacity-50 mt-1 block">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-gray-700 p-4">
                <div className="flex gap-2">
                  <textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Nachricht schreiben... (Enter zum Senden)"
                    className="flex-1 bg-gray-900 text-white rounded-lg px-3 py-2 border border-gray-700 focus:border-accent focus:outline-none resize-none"
                    rows={2}
                    disabled={isSending}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!chatInput.trim() || isSending}
                    className="px-4 py-2 bg-accent text-black rounded-lg font-medium hover:bg-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSending ? <Loader className="animate-spin" size={16} /> : <Send size={16} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Tipp: Drücke Enter zum Senden, Shift+Enter für eine neue Zeile
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
