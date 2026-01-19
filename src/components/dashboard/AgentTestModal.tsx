import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal } from '../ui/Modal.js';
import {
  AlertCircle,
  MessageSquare,
  Loader,
  Send,
  Volume2,
  Phone,
  Mic,
  PhoneOff,
  Video,
  Wand2,
  Save,
  Sparkles,
  X,
} from 'lucide-react';
import { apiClient } from '../../services/apiClient.js';
import { Device } from '@twilio/voice-sdk';
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
  toolCalls?: Array<{
    name: string;
    arguments: Record<string, unknown>;
    result?: unknown;
    error?: string;
  }>;
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
  const queryClient = useQueryClient();

  // Mode selection
  const [testMode, setTestMode] = useState<TestMode>('chat');

  // Chat mode state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Phone mode state
  const [testPhoneNumber, setTestPhoneNumber] = useState(adminTestNumber || '');
  const [isMakingCall, setIsMakingCall] = useState(false);
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [callSid, setCallSid] = useState<string | null>(null);
  const [savedPersonalNumber, setSavedPersonalNumber] = useState<string | null>(null);
  const [isFetchingPersonalNumber, setIsFetchingPersonalNumber] = useState(false);

  // Common refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const transcriptPollInterval = useRef<NodeJS.Timeout | null>(null);
  const chatCallSid = useRef<string>(
    `chat_${Date.now()}_${Math.random().toString(36).substring(7)}`,
  );

  // WebRTC state
  const [twilioDevice, setTwilioDevice] = useState<Device | null>(null);
  const [isInitializingVoice, setIsInitializingVoice] = useState(false);
  const [voiceConnectionStatus, setVoiceConnectionStatus] = useState<
    'disconnected' | 'connecting' | 'connected'
  >('disconnected');
  const [voiceCallStatus, setVoiceCallStatus] = useState<
    'idle' | 'initiating' | 'in-progress' | 'error'
  >('idle');
  const [voiceError, setVoiceError] = useState<string | null>(null);

  // Refinement loop state
  const [isRefinementOpen, setIsRefinementOpen] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [isFetchingPrompt, setIsFetchingPrompt] = useState(false);

  useEffect(() => {
    if (adminTestNumber) {
      setTestPhoneNumber(adminTestNumber);
    }
  }, [adminTestNumber]);

  // Fetch user's personal phone number when phone mode is active
  useEffect(() => {
    if (isOpen && testMode === 'phone' && !savedPersonalNumber) {
      const fetchPersonalNumber = async () => {
        setIsFetchingPersonalNumber(true);
        try {
          const res = await apiClient.get<{
            success: boolean;
            data: { personalPhoneNumber?: string | null };
          }>('/phone/status');
          if (res.data?.success && res.data.data?.personalPhoneNumber) {
            setSavedPersonalNumber(res.data.data.personalPhoneNumber);
            // Also pre-fill the input if empty
            if (!testPhoneNumber) {
              setTestPhoneNumber(res.data.data.personalPhoneNumber);
            }
          }
        } catch (err) {
          console.error('[AgentTestModal] Failed to fetch personal number:', err);
        } finally {
          setIsFetchingPersonalNumber(false);
        }
      };
      fetchPersonalNumber();
    }
  }, [isOpen, testMode, savedPersonalNumber, testPhoneNumber]);

  // Fetch current prompt when modal opens or agent changes
  useEffect(() => {
    if (isOpen && agentConfigId) {
      const fetchPrompt = async () => {
        setIsFetchingPrompt(true);
        try {
          const res = await apiClient.get<any>(`/agents/${agentConfigId}`);
          if (res.data?.success && res.data.data?.config?.systemPrompt) {
            setSystemPrompt(res.data.data.config.systemPrompt);
          }
        } catch (err) {
          console.error('[AgentTestModal] Failed to fetch prompt:', err);
        } finally {
          setIsFetchingPrompt(false);
        }
      };
      fetchPrompt();
    }
  }, [isOpen, agentConfigId]);

  // Check if we have the required data for testing
  const canTest = !!locationId && !!agentConfigId;

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const cleanupResources = useCallback(() => {
    setChatMessages([]);
    setChatInput('');
    setCallStatus('idle');
    setCallSid(null);
    setTestPhoneNumber('');

    if (transcriptPollInterval.current) {
      clearInterval(transcriptPollInterval.current);
      transcriptPollInterval.current = null;
    }

    if (twilioDevice) {
      twilioDevice.destroy();
      setTwilioDevice(null);
    }

    setVoiceConnectionStatus('disconnected');
    setVoiceCallStatus('idle');
    setIsRefinementOpen(false);
  }, [twilioDevice]);

  const handleSaveInstructions = async () => {
    if (!agentConfigId || !systemPrompt.trim()) return;

    setIsSavingPrompt(true);
    try {
      await apiClient.patch(`/agents/${agentConfigId}`, {
        config: {
          systemPrompt: systemPrompt.trim(),
        },
      });
      toast.success('Anweisungen erfolgreich aktualisiert & synchronisiert');
      // Optionally reset session to use new prompt
      if (testMode === 'chat') {
        chatCallSid.current = `chat_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        setChatMessages([]);
      }
    } catch (err) {
      const msg = extractErrorMessage(err, 'Fehler beim Speichern der Anweisungen');
      toast.error(msg);
    } finally {
      setIsSavingPrompt(false);
    }
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      cleanupResources();
    }
  }, [isOpen, cleanupResources]);

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
        toolCalls?: ChatMessage['toolCalls'];
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
          toolCalls: response.data.toolCalls,
        };
        setChatMessages((prev) => [...prev, assistantMessage]);

        if (response.data.audio_url) {
          playAudio(response.data.audio_url);
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
  const startTranscriptPolling = (sessionId: string) => {
    if (transcriptPollInterval.current) {
      clearInterval(transcriptPollInterval.current);
    }

    transcriptPollInterval.current = setInterval(async () => {
      try {
        const response = await apiClient.get<{
          success: boolean;
          transcript: ChatMessage[];
        }>(`/v1/test-call/${sessionId}/transcript`);

        if (response.data.success) {
          setChatMessages(response.data.transcript);

          // Stop polling if call is completed/failed
          // We check the last message or wait for status update
        }
      } catch (err) {
        console.error('[AgentTestModal] Transcript poll error:', err);
      }
    }, 2000);
  };

  const handleMakeTestCall = async () => {
    if (!testPhoneNumber.trim()) {
      toast.warning('Bitte gib eine Telefonnummer ein');
      return;
    }

    setIsMakingCall(true);
    setCallStatus('initiated');
    setCallSid(null);
    setChatMessages([]); // Clear previous transcript

    try {
      const response = await apiClient.post<{
        success: boolean;
        data: { callSid: string; status: string };
      }>('/dashboard/agent/test-call', {
        to: testPhoneNumber.trim(),
      });

      if (response.data?.success) {
        const { callSid: sid, status } = response.data.data;
        setCallSid(sid);
        updateCallStatus(status);

        toast.success(`Testanruf gestartet!`);
        startTranscriptPolling(sid);
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

  const updateCallStatus = (status: string) => {
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

    // Stop polling if terminal status
    if (['completed', 'failed', 'busy', 'no-answer'].includes(mappedStatus)) {
      if (transcriptPollInterval.current) {
        clearInterval(transcriptPollInterval.current);
        transcriptPollInterval.current = null;
      }
    }
  };

  // Voice mode functions (WebRTC)
  const connectToVoice = async () => {
    try {
      setIsInitializingVoice(true);
      setVoiceConnectionStatus('connecting');
      setVoiceError(null);

      const response = await apiClient.get<{
        success: boolean;
        token: string;
        identity: string;
        appSid: string;
      }>('/v1/test-call/voice-token');

      if (!response.data.success) {
        throw new Error('Token generation failed');
      }

      const device = new Device(response.data.token, {
        logLevel: 'debug',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        codecPreferences: ['opus', 'pcmu'] as any,
        enableImprovedSignalingErrorPrecision: true,
      });

      device.on('registered', () => {
        setVoiceConnectionStatus('connected');
        setIsInitializingVoice(false);
      });

      device.on('error', (error: { message: string }) => {
        console.error('[AgentTestModal] Voice device error:', error);
        setVoiceError(error.message);
        setVoiceConnectionStatus('disconnected');
        setIsInitializingVoice(false);
      });

      await device.register();
      setTwilioDevice(device);
      toast.success('Sprachverbindung bereit');
    } catch (error) {
      const err = extractErrorMessage(error, 'Voice Verbindung fehlgeschlagen');
      setVoiceError(err);
      setVoiceConnectionStatus('disconnected');
      setIsInitializingVoice(false);
      toast.error(err);
    }
  };

  const handleStartVoiceTest = async () => {
    if (!twilioDevice) {
      await connectToVoice();
    }

    if (!twilioDevice) return;

    try {
      setVoiceCallStatus('initiating');
      setChatMessages([]);

      const call = await twilioDevice.connect({
        params: {
          To: 'agent',
          locationId: locationId || '',
        },
      });

      call.on('accept', () => {
        setVoiceCallStatus('in-progress');
        toast.success('Verbunden!');

        // Use the call SID to poll transcript if available
        // WebRTC calls also have a SID
        if (call.parameters.CallSid) {
          setCallSid(call.parameters.CallSid);
          startTranscriptPolling(call.parameters.CallSid);
        }
      });

      call.on('disconnect', () => {
        setVoiceCallStatus('idle');
        if (transcriptPollInterval.current) {
          clearInterval(transcriptPollInterval.current);
        }
      });
    } catch (error) {
      const err = extractErrorMessage(error, 'Anruf fehlgeschlagen');
      setVoiceCallStatus('error');
      toast.error(err);
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
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-3">
          <span>Agent testen</span>
          <button
            onClick={() => setIsRefinementOpen(!isRefinementOpen)}
            className={`p-1.5 rounded-md transition flex items-center gap-1.5 text-xs font-semibold ${
              isRefinementOpen
                ? 'bg-accent/20 text-accent border border-accent/30'
                : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
            }`}
          >
            <Wand2 size={14} />
            Quick-Edit
          </button>
        </div>
      }
      size={isRefinementOpen ? 'xl' : 'lg'}
    >
      <audio ref={audioRef} className="hidden" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className={`space-y-4 ${isRefinementOpen ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
          {!canTest ? (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="text-yellow-400 mt-0.5" size={20} />
              <div>
                <h3 className="text-sm font-semibold text-yellow-300 mb-1">
                  Agent-Konfiguration fehlt
                </h3>
                <p className="text-xs text-yellow-200/80">
                  Bitte vervollständige zuerst die Agent-Konfiguration, um den Agent testen zu
                  können.
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

              {/* Status & Controls Section */}
              <div className="space-y-3">
                {testMode === 'chat' && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex items-start gap-2">
                    <MessageSquare className="text-blue-400 mt-0.5" size={16} />
                    <p className="text-xs text-blue-200">
                      Teste deinen Voice Agent im Chat-Modus. Der Agent antwortet mit Text und
                      Audio.
                    </p>
                  </div>
                )}

                {testMode === 'voice' && (
                  <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${voiceConnectionStatus === 'connected' ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}
                        >
                          <Mic size={20} />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-white">Browser Voice Test</h4>
                          <p className="text-[10px] text-gray-400">
                            {voiceConnectionStatus === 'connected'
                              ? 'Verbunden & Bereit'
                              : 'Mikrofon-Test im Browser'}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {voiceConnectionStatus !== 'connected' ? (
                          <button
                            onClick={connectToVoice}
                            disabled={isInitializingVoice}
                            className="px-4 py-2 bg-gray-700 text-white rounded-lg text-xs font-medium hover:bg-gray-600 transition flex items-center gap-2"
                          >
                            {isInitializingVoice ? (
                              <Loader className="animate-spin text-accent" size={14} />
                            ) : (
                              <Video size={14} />
                            )}
                            Initialisieren
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={handleStartVoiceTest}
                              disabled={voiceCallStatus !== 'idle'}
                              className={`px-4 py-2 rounded-lg text-xs font-medium transition flex items-center gap-2 ${
                                voiceCallStatus === 'in-progress'
                                  ? 'bg-green-600 text-white'
                                  : 'bg-accent text-black hover:bg-accent/80'
                              }`}
                            >
                              {voiceCallStatus === 'initiating' ? (
                                <Loader className="animate-spin" size={14} />
                              ) : (
                                <Phone size={14} />
                              )}
                              {voiceCallStatus === 'in-progress' ? 'Verbunden' : 'Sprechen'}
                            </button>
                            {voiceCallStatus === 'in-progress' && (
                              <button
                                onClick={() => twilioDevice?.disconnectAll()}
                                className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                                title="Auflegen"
                              >
                                <PhoneOff size={14} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    {voiceError && <p className="text-[10px] text-red-400 mt-2">{voiceError}</p>}
                  </div>
                )}

                {testMode === 'phone' && (
                  <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 space-y-3">
                    {/* Info box showing saved personal number */}
                    {savedPersonalNumber && (
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-start gap-2">
                        <Phone className="text-green-400 mt-0.5" size={14} />
                        <div>
                          <p className="text-xs text-green-200">
                            Deine gespeicherte Nummer:{' '}
                            <strong className="font-mono">{savedPersonalNumber}</strong>
                          </p>
                          <p className="text-[10px] text-green-300/60 mt-0.5">
                            Klick unten auf "Mich jetzt anrufen" — wir rufen dich an.
                          </p>
                        </div>
                      </div>
                    )}
                    {!savedPersonalNumber && !isFetchingPersonalNumber && (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-start gap-2">
                        <AlertCircle className="text-amber-400 mt-0.5" size={14} />
                        <p className="text-xs text-amber-200">
                          Keine Handynummer gespeichert. Gib unten eine Nummer ein oder speichere
                          deine Nummer in den Einstellungen.
                        </p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        value={testPhoneNumber}
                        onChange={(e) => setTestPhoneNumber(e.target.value)}
                        placeholder="+41791234567"
                        aria-label="Telefonnummer für Testanruf"
                        className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:border-accent"
                        disabled={isMakingCall || callStatus !== 'idle'}
                      />
                      <button
                        onClick={handleMakeTestCall}
                        disabled={isMakingCall || !testPhoneNumber.trim() || callStatus !== 'idle'}
                        className="px-4 py-2 bg-accent text-black rounded-lg text-xs font-semibold hover:bg-accent/80 transition disabled:opacity-50 flex items-center gap-2"
                      >
                        {isMakingCall ? (
                          <Loader className="animate-spin" size={14} />
                        ) : (
                          <Phone size={14} />
                        )}
                        {savedPersonalNumber && testPhoneNumber === savedPersonalNumber
                          ? 'Mich jetzt anrufen'
                          : 'Anrufen'}
                      </button>
                      {callStatus !== 'idle' &&
                        !['completed', 'failed', 'busy', 'no-answer'].includes(callStatus) && (
                          <div className="flex items-center gap-2 px-3 bg-blue-500/20 rounded-lg border border-blue-500/30 text-blue-300 text-[10px] font-medium animate-pulse">
                            <Loader className="animate-spin" size={12} />
                            {callStatus === 'ringing' ? 'Klingelt...' : 'In-Progress'}
                          </div>
                        )}
                    </div>
                  </div>
                )}
              </div>

              {/* Conversation / Transcript Feed */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 h-[450px] flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-2 py-8">
                      <div className="p-4 rounded-full bg-gray-700/50 mb-2">
                        {testMode === 'chat' ? (
                          <MessageSquare size={32} className="opacity-20" />
                        ) : (
                          <Mic size={32} className="opacity-20" />
                        )}
                      </div>
                      <p className="text-sm font-medium">Bereit zum Testen</p>
                      <p className="text-xs text-gray-500 max-w-[200px]">
                        {testMode === 'chat'
                          ? 'Schreibe eine Nachricht, um das Gespräch zu beginnen.'
                          : 'Starte einen Anruf, um das Live-Transkript hier zu sehen.'}
                      </p>
                    </div>
                  ) : (
                    chatMessages.map((msg, index) => (
                      <div
                        key={`${msg.timestamp}-${index}`}
                        className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                      >
                        <div className={`flex items-center gap-2 mb-1 px-1`}>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
                            {msg.role === 'user' ? 'Du' : 'Agent'}
                          </span>
                          <span className="text-[9px] text-gray-600">
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm ${
                            msg.role === 'user'
                              ? 'bg-accent text-black rounded-tr-none'
                              : 'bg-gray-700 text-white rounded-tl-none border border-gray-600'
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{msg.text}</p>

                          {msg.audioUrl && msg.role === 'assistant' && (
                            <button
                              onClick={() => playAudio(msg.audioUrl!)}
                              className="mt-2 flex items-center gap-1.5 text-[10px] font-medium text-black/60 bg-black/10 hover:bg-black/20 px-2 py-1 rounded-full transition"
                            >
                              <Volume2 size={12} />
                              Anhören
                            </button>
                          )}
                        </div>

                        {/* Tool Calls Display */}
                        {msg.toolCalls && msg.toolCalls.length > 0 && (
                          <div className="mt-2 w-[85%] space-y-1.5">
                            {msg.toolCalls.map((tool, tIdx) => (
                              <div
                                key={tIdx}
                                className="bg-gray-900/40 border border-gray-700/50 rounded-lg p-2 flex items-start gap-2"
                              >
                                {tool.error ? (
                                  <AlertCircle size={14} className="text-red-400 mt-0.5" />
                                ) : (
                                  <Loader size={12} className="text-green-400 mt-1" />
                                )}
                                <div className="flex-1 overflow-hidden">
                                  <p className="text-[10px] font-mono text-gray-400 truncate">
                                    {tool.name === 'calendar'
                                      ? '📅 Kalender-Aktion'
                                      : `🛠️ ${tool.name}`}
                                  </p>
                                  {tool.error && (
                                    <p className="text-[9px] text-red-300 mt-0.5">{tool.error}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Debug footer if sid present */}
                {callSid && (
                  <div className="px-4 py-1 bg-gray-900/80 border-t border-gray-700/50 flex justify-between items-center">
                    <span className="text-[8px] font-mono text-gray-500">ID: {callSid}</span>
                    <span className="text-[8px] font-mono text-accent/50 uppercase">
                      {testMode} ACTIVE
                    </span>
                  </div>
                )}

                {/* Chat Input (Only show in Chat mode) */}
                {testMode === 'chat' && (
                  <div className="p-4 bg-gray-900/50 border-t border-gray-700">
                    <div className="flex gap-2 bg-gray-800 p-1.5 rounded-xl border border-gray-700 focus-within:border-accent transition">
                      <textarea
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Deine Nachricht..."
                        className="flex-1 bg-transparent text-white text-sm px-3 py-2 outline-none resize-none"
                        rows={1}
                        disabled={isSending}
                      />
                      <button
                        onClick={sendChatMessage}
                        disabled={!chatInput.trim() || isSending}
                        aria-label="Nachricht senden"
                        className="p-3 bg-accent text-black rounded-lg hover:bg-accent/80 transition disabled:opacity-50"
                      >
                        {isSending ? (
                          <Loader className="animate-spin" size={18} />
                        ) : (
                          <Send size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Refinement Side Panel */}
        {isRefinementOpen && (
          <div className="lg:col-span-5 bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden flex flex-col h-[700px]">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between bg-gray-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-accent/20 rounded-lg text-accent">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Anweisungen verfeinern</h3>
                  <p className="text-[10px] text-gray-400">Verhalten des Agents direkt anpassen</p>
                </div>
              </div>
              <button
                onClick={() => setIsRefinementOpen(false)}
                className="p-1 hover:bg-gray-700 rounded-md text-gray-400 hover:text-white transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  System Prompt / Instruktionen
                </label>
                {isFetchingPrompt ? (
                  <div className="h-40 flex flex-col items-center justify-center bg-gray-900/50 rounded-lg border border-gray-800 animate-pulse">
                    <Loader size={20} className="animate-spin text-accent/50 mb-2" />
                    <span className="text-xs text-gray-500">Lade Instruktionen...</span>
                  </div>
                ) : (
                  <textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="Beschreibe hier, wie sich der Agent verhalten soll..."
                    className="w-full h-[450px] bg-gray-900 text-white text-sm px-4 py-3 rounded-lg border border-gray-700 focus:border-accent outline-none font-mono leading-relaxed"
                  />
                )}
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-[10px] text-blue-300 leading-relaxed">
                  <strong>Pro-Tipp:</strong> Änderungen hier werden sofort gespeichert und
                  synchronisiert. Starte danach einen neuen Test, um die Änderungen zu prüfen.
                </p>
              </div>
            </div>

            <div className="p-4 bg-gray-800 border-t border-gray-700">
              <button
                onClick={handleSaveInstructions}
                disabled={isSavingPrompt || !systemPrompt.trim() || isFetchingPrompt}
                className="w-full py-2.5 bg-accent text-black rounded-lg font-bold text-sm hover:bg-accent/80 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSavingPrompt ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                Speichern & Synchronisieren
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
