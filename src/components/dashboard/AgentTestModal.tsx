import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../ui/Modal.js';
import { AlertCircle, MessageSquare, Loader, Send, Volume2, Phone, Mic } from 'lucide-react';
import { apiClient } from '../../services/apiClient.js';
import { toast } from '../ui/Toast.js';
import { useQueryClient } from '@tanstack/react-query';
import { extractErrorMessage } from '../../lib/errorUtils.js';

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

type TestMode = 'chat' | 'voice' | 'phone';

type CallStatus =
  | 'idle'
  | 'initiated'
  | 'ringing'
  | 'in-progress'
  | 'completed'
  | 'failed'
  | 'busy'
  | 'no-answer';

export const AgentTestModal: React.FC<AgentTestModalProps> = ({
  isOpen,
  onClose,
  agentConfigId,
  locationId,
  adminTestNumber,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Mode selection
  const [testMode, setTestMode] = useState<TestMode>('chat');

  // Chat mode state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatCallSid = useRef(`test_${Date.now()}_${Math.random().toString(36).substring(7)}`);

  // Phone mode state
  const [testPhoneNumber, setTestPhoneNumber] = useState(adminTestNumber || '');
  const [isMakingCall, setIsMakingCall] = useState(false);
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [callSid, setCallSid] = useState<string | null>(null);

  // Common refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update test phone number when adminTestNumber prop changes
  useEffect(() => {
    if (adminTestNumber) {
      setTestPhoneNumber(adminTestNumber);
    }
  }, [adminTestNumber]);

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
      setCallStatus('idle');
      setCallSid(null);
      setTestPhoneNumber('');
    }
  }, [isOpen]);

  // Chat mode functions
  const sendChatMessage = async () => {
    if (!chatInput.trim() || !locationId || isSending) return;

    setIsSending(true);
    const messageText = chatInput.trim();

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
        call_sid: chatCallSid.current,
      });

      if (response.data.success) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          text: response.data.text,
          timestamp: new Date().toISOString(),
          audioUrl: response.data.audio_url,
        };
        setChatMessages((prev) => [...prev, assistantMessage]);

        if (response.data.audio_url && audioRef.current) {
          audioRef.current.src = response.data.audio_url;
          audioRef.current.play().catch((err) => {
            console.error('Failed to play audio:', err);
          });
        }
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error: unknown) {
      console.error('[AgentTestModal] Chat message error:', error);
      const errorMessage = extractErrorMessage(error, 'Fehler beim Senden der Nachricht');
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

  // Phone mode functions
  const handleMakeTestCall = async () => {
    if (!testPhoneNumber.trim()) {
      toast.warning('Bitte gib eine Telefonnummer ein');
      return;
    }

    setIsMakingCall(true);
    setCallStatus('initiated');
    setCallSid(null);

    try {
      const response = await apiClient.post<{
        success: boolean;
        data: { callSid: string; status: string };
      }>('/dashboard/agent/test-call', {
        to: testPhoneNumber.trim(),
      });

      if (response.data?.success) {
        const { callSid, status } = response.data.data;
        setCallSid(callSid);

        const mappedStatus: CallStatus =
          status === 'queued' || status === 'initiated'
            ? 'initiated'
            : status === 'ringing'
              ? 'ringing'
              : status === 'in-progress'
                ? 'in-progress'
                : status === 'completed'
                  ? 'completed'
                  : status === 'busy'
                    ? 'busy'
                    : status === 'no-answer'
                      ? 'no-answer'
                      : status === 'failed' || status === 'canceled'
                        ? 'failed'
                        : 'initiated';

        setCallStatus(mappedStatus);
        toast.success(`Testanruf gestartet! Call SID: ${callSid}`);
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] });
      } else {
        throw new Error('Testanruf fehlgeschlagen');
      }
    } catch (err: unknown) {
      console.error('[AgentTestModal] Error making test call:', err);
      const errorMsg = extractErrorMessage(err, 'Fehler beim Starten des Testanrufs');
      setCallStatus('failed');
      toast.error(errorMsg);
    } finally {
      setIsMakingCall(false);
    }
  };

  // Voice mode functions
  const handleStartVoiceTest = () => {
    if (canTest) {
      onClose();
      navigate('/dashboard/test-call');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  const handleClose = () => {
    setChatMessages([]);
    setChatInput('');
    setTestPhoneNumber('');
    setCallStatus('idle');
    setCallSid(null);
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
    <Modal isOpen={isOpen} onClose={handleClose} title="Agent testen" size="lg">
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
            {/* Mode Switcher */}
            <div className="flex gap-2 p-1 bg-gray-800 rounded-lg">
              <button
                onClick={() => setTestMode('chat')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition ${
                  testMode === 'chat'
                    ? 'bg-accent text-black'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <MessageSquare size={16} />
                Chat
              </button>
              <button
                onClick={() => setTestMode('voice')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition ${
                  testMode === 'voice'
                    ? 'bg-accent text-black'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Mic size={16} />
                Voice
              </button>
              <button
                onClick={() => setTestMode('phone')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition ${
                  testMode === 'phone'
                    ? 'bg-accent text-black'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Phone size={16} />
                Telefon
              </button>
            </div>

            {/* Chat Mode */}
            {testMode === 'chat' && (
              <>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex items-start gap-2">
                  <MessageSquare className="text-blue-400 mt-0.5" size={16} />
                  <div>
                    <p className="text-xs text-blue-200">
                      Teste deinen Voice Agent im Chat-Modus. Der Agent antwortet mit Text und
                      Audio.
                    </p>
                  </div>
                </div>

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
                              msg.role === 'user'
                                ? 'bg-accent text-black'
                                : 'bg-gray-700 text-white'
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
                        onClick={sendChatMessage}
                        disabled={!chatInput.trim() || isSending}
                        className="px-4 py-2 bg-accent text-black rounded-lg font-medium hover:bg-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isSending ? (
                          <Loader className="animate-spin" size={16} />
                        ) : (
                          <Send size={16} />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      💡 Tipp: Drücke Enter zum Senden, Shift+Enter für eine neue Zeile
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Voice Mode (WebRTC) */}
            {testMode === 'voice' && (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Mic className="text-accent" size={24} />
                  <div>
                    <h3 className="text-lg font-semibold text-white">Browser Voice Test</h3>
                    <p className="text-sm text-gray-400">
                      Teste den Agent direkt im Browser mit WebRTC
                    </p>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
                  <p className="text-xs text-blue-200">
                    Sprich direkt mit dem Agent über dein Mikrofon. Der Agent hört zu und antwortet
                    in Echtzeit.
                  </p>
                </div>

                <button
                  onClick={handleStartVoiceTest}
                  className="w-full px-6 py-3 bg-accent text-black rounded-lg font-semibold hover:bg-accent/80 transition-colors flex items-center justify-center gap-2"
                >
                  <Mic size={20} />
                  Voice Test starten
                </button>
              </div>
            )}

            {/* Phone Mode */}
            {testMode === 'phone' && (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Phone className="text-accent" size={24} />
                  <div>
                    <h3 className="text-lg font-semibold text-white">Testanruf starten</h3>
                    <p className="text-sm text-gray-400">Starte einen echten Anruf über Twilio</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Telefonnummer (E.164 Format)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        value={testPhoneNumber}
                        onChange={(e) => setTestPhoneNumber(e.target.value)}
                        placeholder="+41791234567"
                        className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent"
                        disabled={isMakingCall || callStatus !== 'idle'}
                      />
                      <button
                        onClick={handleMakeTestCall}
                        disabled={isMakingCall || !testPhoneNumber.trim() || callStatus !== 'idle'}
                        className="px-6 py-2 bg-accent text-black rounded-lg font-semibold hover:bg-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isMakingCall ? (
                          <>
                            <Loader className="animate-spin" size={16} />
                            Rufe an...
                          </>
                        ) : (
                          <>
                            <Phone size={16} />
                            Anrufen
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {callStatus !== 'idle' && (
                    <div
                      className={`p-4 rounded-lg border ${
                        callStatus === 'completed'
                          ? 'bg-green-500/20 border-green-500/30 text-green-300'
                          : callStatus === 'failed' ||
                              callStatus === 'busy' ||
                              callStatus === 'no-answer'
                            ? 'bg-red-500/20 border-red-500/30 text-red-300'
                            : 'bg-blue-500/20 border-blue-500/30 text-blue-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {(callStatus === 'initiated' ||
                          callStatus === 'ringing' ||
                          callStatus === 'in-progress') && (
                          <Loader className="animate-spin" size={16} />
                        )}
                        <span className="font-semibold">
                          {callStatus === 'initiated' && 'Anruf wird initiiert...'}
                          {callStatus === 'ringing' && 'Telefon klingelt...'}
                          {callStatus === 'in-progress' && 'Anruf läuft...'}
                          {callStatus === 'completed' && 'Anruf erfolgreich abgeschlossen'}
                          {callStatus === 'failed' && 'Anruf fehlgeschlagen'}
                          {callStatus === 'busy' && 'Telefonnummer ist besetzt'}
                          {callStatus === 'no-answer' && 'Keine Antwort'}
                        </span>
                      </div>
                      {callSid && (
                        <div className="text-xs font-mono opacity-70">Call SID: {callSid}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};
