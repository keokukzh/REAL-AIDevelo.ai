import React from 'react';
import { Modal } from '../ui/Modal.js';
import {
  Phone,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Copy,
  Database,
  Bot,
} from 'lucide-react';
import { useCallDetails } from '../../hooks/useCallDetails.js';
import { CallLog } from '../../hooks/useCallLogs.js';
import { toast } from '../ui/Toast.js';
import { apiRequest } from '../../services/api.js';
import { Button } from '../ui/Button.js';

interface CallNotes {
  transcript?: string;
  transcription?: string;
  recordingUrl?: string;
  recording_url?: string;
  rag?: {
    enabled: boolean;
    totalQueries?: number;
    totalResults?: number;
    totalInjectedChars?: number;
    lastQuery?: {
      query: string;
      results: number;
      injectedChars: number;
    };
    topSources?: Array<{
      documentId: string;
      chunkIndex: number;
      score: number;
      title?: string;
      fileName?: string;
    }>;
  };
  ai_feedback?: {
    rating: 'positive' | 'negative';
    comment?: string;
    timestamp?: string;
    user?: string;
  };
  elevenConversationId?: string;
}

interface CallDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  call: CallLog | null;
  callSid?: string | null; // Optional: if provided, will lazy load details
}

export const CallDetailsModal: React.FC<CallDetailsModalProps> = ({
  isOpen,
  onClose,
  call,
  callSid,
}) => {
  // If callSid is provided but call is not, lazy load it
  const { data: lazyCall, isLoading: isLoadingDetails } = useCallDetails(callSid || null);
  const displayCall = call || lazyCall;

  // Feedback state
  const [feedbackRating, setFeedbackRating] = React.useState<'positive' | 'negative' | null>(
    (displayCall?.notes as CallNotes)?.ai_feedback?.rating || null,
  );
  const [feedbackComment, setFeedbackComment] = React.useState(
    (displayCall?.notes as CallNotes)?.ai_feedback?.comment || '',
  );
  const [isSubmittingFeedback, setIsSubmittingFeedback] = React.useState(false);
  const [feedbackSaved, setFeedbackSaved] = React.useState(
    !!(displayCall?.notes as CallNotes)?.ai_feedback,
  );

  // Sync state when displayCall changes
  React.useEffect(() => {
    if (displayCall?.notes) {
      const notes = displayCall.notes as CallNotes;
      const aiFeedback = notes.ai_feedback;
      if (aiFeedback) {
        setFeedbackRating(aiFeedback.rating);
        setFeedbackComment(aiFeedback.comment || '');
        setFeedbackSaved(true);
      } else {
        setFeedbackRating(null);
        setFeedbackComment('');
        setFeedbackSaved(false);
      }
    }
  }, [displayCall]);

  const handleCopyCallSid = async () => {
    if (!displayCall?.callSid) return;
    try {
      await navigator.clipboard.writeText(displayCall.callSid);
      toast.success('Call SID kopiert');
    } catch {
      // Fallback: select text
      const textArea = document.createElement('textarea');
      textArea.value = displayCall.callSid;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        toast.success('Call SID kopiert');
      } catch {
        toast.error('Kopieren fehlgeschlagen');
      }
      textArea.remove();
    }
  };

  const handleCopyConversationId = async (conversationId: string) => {
    if (!conversationId) return;
    try {
      await navigator.clipboard.writeText(conversationId);
      toast.success('Conversation ID kopiert');
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = conversationId;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        toast.success('Conversation ID kopiert');
      } catch {
        toast.error('Kopieren fehlgeschlagen');
      }
      textArea.remove();
    }
  };

  const handleSubmitFeedback = async () => {
    if (!displayCall || !feedbackRating) {
      toast.error('Bitte wählen Sie eine Bewertung aus');
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      await apiRequest(`/calls/${displayCall.id}/feedback`, {
        method: 'POST',
        data: {
          rating: feedbackRating,
          comment: feedbackComment,
        },
      });
      setFeedbackSaved(true);
      toast.success('Feedback gespeichert');
    } catch (error) {
      console.error('Failed to save feedback', error);
      toast.error('Feedback konnte nicht gespeichert werden');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  if (!isOpen) return null;

  if (isLoadingDetails && !call) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Anruf-Details" size="md">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          <span className="ml-3 text-sm text-gray-400">Lade Details...</span>
        </div>
      </Modal>
    );
  }

  if (!displayCall) return null;

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPhoneNumber = (e164: string | null): string => {
    if (!e164) return 'Unbekannt';
    return e164;
  };

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getOutcomeIcon = () => {
    if (!displayCall?.outcome) return null;
    const outcome = displayCall.outcome.toLowerCase();
    if (outcome.includes('success') || outcome.includes('completed')) {
      return <CheckCircle className="text-green-400" size={20} />;
    } else if (outcome.includes('failed') || outcome.includes('error')) {
      return <XCircle className="text-red-400" size={20} />;
    }
    return <AlertCircle className="text-yellow-400" size={20} />;
  };

  // Extract transcript and recording URL from notes
  const callNotes = (displayCall.notes as CallNotes) || {};
  const transcript = callNotes.transcript || callNotes.transcription || null;
  const recordingUrl = callNotes.recordingUrl || callNotes.recording_url || null;
  const rag = callNotes.rag || null;
  const elevenConversationId = callNotes.elevenConversationId || null;

  const ThumbsUp = ({ active, onClick }: { active: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      title="Positives Feedback"
      className={`p-2 rounded-lg transition-all ${active ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-gray-800 text-gray-500 hover:text-gray-300'}`}
    >
      <CheckCircle size={24} />
    </button>
  );

  const ThumbsDown = ({ active, onClick }: { active: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      title="Negatives Feedback"
      className={`p-2 rounded-lg transition-all ${active ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-gray-800 text-gray-500 hover:text-gray-300'}`}
    >
      <XCircle size={24} />
    </button>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Anruf-Details" size="lg">
      <div className="space-y-4">
        {/* Header: Call SID + Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                displayCall.direction === 'inbound'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              }`}
            >
              {displayCall.direction === 'inbound' ? 'Eingehend' : 'Ausgehend'}
            </span>
            {getOutcomeIcon()}
            {displayCall.outcome && (
              <span className="px-2 py-1 rounded text-xs bg-gray-700 text-gray-300">
                {displayCall.outcome}
              </span>
            )}
          </div>
          {displayCall.callSid && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-mono">{displayCall.callSid}</span>
              <button
                onClick={handleCopyCallSid}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
                title="Call SID kopieren"
              >
                <Copy size={14} className="text-gray-400" />
              </button>
            </div>
          )}
        </div>

        {/* Phone Numbers */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Phone size={16} className="text-gray-400" />
              <span className="text-xs text-gray-400">Von</span>
            </div>
            <p className="text-sm font-mono">{formatPhoneNumber(displayCall.from_e164)}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Phone size={16} className="text-gray-400" />
              <span className="text-xs text-gray-400">Nach</span>
            </div>
            <p className="text-sm font-mono">{formatPhoneNumber(displayCall.to_e164)}</p>
          </div>
        </div>

        {/* Timestamps */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={16} className="text-gray-400" />
              <span className="text-xs text-gray-400">Gestartet</span>
            </div>
            <p className="text-sm">{formatDateTime(displayCall.started_at)}</p>
          </div>
          {displayCall.ended_at && (
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={16} className="text-gray-400" />
                <span className="text-xs text-gray-400">Beendet</span>
              </div>
              <p className="text-sm">{formatDateTime(displayCall.ended_at)}</p>
            </div>
          )}
        </div>

        {/* Duration */}
        <div className="flex items-center gap-3 bg-gray-800 rounded-lg p-4 border border-gray-700">
          <Clock size={16} className="text-gray-400" />
          <div>
            <span className="text-xs text-gray-400">Dauer:</span>
            <p className="text-sm font-medium">{formatDuration(displayCall.duration_sec)}</p>
          </div>
        </div>

        {/* Transcript */}
        {transcript && (
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Transcript</h3>
            <p className="text-sm text-gray-200 whitespace-pre-wrap">{transcript}</p>
          </div>
        )}

        {/* Recording URL */}
        {recordingUrl && (
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Recording</h3>
            <a
              href={recordingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 bg-accent text-black rounded hover:bg-accent/80 transition-colors text-sm"
            >
              <ExternalLink size={16} />
              Recording anhören
            </a>
          </div>
        )}

        {/* AI Feedback Loop */}
        <div className="bg-accent/5 border border-accent/20 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bot size={18} className="text-accent" />
            <h3 className="font-bold">AI Feedback Loop</h3>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-400 mb-2">Wie war die Leistung des Agenten?</p>
              <div className="flex gap-3">
                <ThumbsUp
                  active={feedbackRating === 'positive'}
                  onClick={() => setFeedbackRating('positive')}
                />
                <ThumbsDown
                  active={feedbackRating === 'negative'}
                  onClick={() => setFeedbackRating('negative')}
                />
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-400 mb-2">Anmerkungen zur Verbesserung (Optional)</p>
              <textarea
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                placeholder="z.B. Er hat die Frage nach X falsch beantwortet..."
                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-accent focus:outline-none min-h-[80px]"
              />
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmitFeedback}
              disabled={isSubmittingFeedback || !feedbackRating}
              className="w-full flex items-center justify-center gap-2"
            >
              <CheckCircle size={16} />
              {feedbackSaved ? 'Feedback aktualisieren' : 'Feedback senden'}
            </Button>
          </div>
        </div>

        {/* RAG Stats */}
        {rag && (
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <Database size={16} className="text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-300">RAG Stats</h3>
            </div>

            {/* Enabled Badge */}
            <div className="mb-3">
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  rag.enabled
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                    : 'bg-gray-700 text-gray-400 border border-gray-600'
                }`}
              >
                {rag.enabled ? 'Aktiviert' : 'Deaktiviert'}
              </span>
            </div>

            {/* Stats Grid */}
            {rag.enabled && (
              <>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <span className="text-xs text-gray-400">Queries</span>
                    <p className="text-sm font-medium text-gray-200">{rag.totalQueries || 0}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">Results</span>
                    <p className="text-sm font-medium text-gray-200">{rag.totalResults || 0}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">Injected Chars</span>
                    <p className="text-sm font-medium text-gray-200">
                      {rag.totalInjectedChars || 0}
                    </p>
                  </div>
                </div>

                {/* Last Query */}
                {rag.lastQuery && (
                  <div className="mb-3 p-2 bg-gray-900/50 rounded border border-gray-700">
                    <span className="text-xs text-gray-400 mb-1 block">Letzte Query</span>
                    <p className="text-xs text-gray-300 mb-2">{rag.lastQuery.query}</p>
                    <div className="flex gap-3 text-xs">
                      <span className="text-gray-400">
                        Results: <span className="text-gray-300">{rag.lastQuery.results}</span>
                      </span>
                      <span className="text-gray-400">
                        Chars: <span className="text-gray-300">{rag.lastQuery.injectedChars}</span>
                      </span>
                    </div>
                  </div>
                )}

                {/* Top Sources Table */}
                {rag.topSources && rag.topSources.length > 0 && (
                  <div>
                    <span className="text-xs text-gray-400 mb-2 block">
                      Top Sources ({rag.topSources.length})
                    </span>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="text-left text-gray-400 py-1 px-2">Score</th>
                            <th className="text-left text-gray-400 py-1 px-2">Title</th>
                            <th className="text-left text-gray-400 py-1 px-2">File</th>
                            <th className="text-left text-gray-400 py-1 px-2">Doc ID</th>
                            <th className="text-left text-gray-400 py-1 px-2">Chunk</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rag.topSources.map(
                            (
                              source: {
                                documentId: string;
                                chunkIndex: number;
                                score: number;
                                title?: string;
                                fileName?: string;
                              },
                              idx: number,
                            ) => (
                              <tr
                                key={`${source.documentId}-${source.chunkIndex}-${idx}`}
                                className="border-b border-gray-800"
                              >
                                <td className="py-1 px-2 text-gray-300 font-mono">
                                  {source.score?.toFixed(3) || '-'}
                                </td>
                                <td
                                  className="py-1 px-2 text-gray-300 truncate max-w-[120px]"
                                  title={source.title}
                                >
                                  {source.title || '-'}
                                </td>
                                <td
                                  className="py-1 px-2 text-gray-400 truncate max-w-[100px]"
                                  title={source.fileName}
                                >
                                  {source.fileName || '-'}
                                </td>
                                <td
                                  className="py-1 px-2 text-gray-400 font-mono text-[10px] truncate max-w-[80px]"
                                  title={source.documentId}
                                >
                                  {source.documentId || '-'}
                                </td>
                                <td className="py-1 px-2 text-gray-400 font-mono">
                                  {source.chunkIndex ?? '-'}
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ElevenLabs Conversation ID */}
        {elevenConversationId && (
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Bot size={16} className="text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-300">ElevenLabs</h3>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-gray-400 flex-1 truncate">
                {elevenConversationId}
              </span>
              <button
                onClick={() => handleCopyConversationId(elevenConversationId)}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
                title="Conversation ID kopieren"
              >
                <Copy size={14} className="text-gray-400" />
              </button>
            </div>
          </div>
        )}

        {/* Notes (if available and not already shown as transcript) */}
        {callNotes &&
          typeof callNotes === 'object' &&
          Object.keys(callNotes).length > 0 &&
          !transcript &&
          !rag &&
          !elevenConversationId && (
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Notizen</h3>
              <pre className="text-xs text-gray-300 overflow-auto max-h-48">
                {JSON.stringify(callNotes, null, 2)}
              </pre>
            </div>
          )}

        {/* Call ID */}
        <div className="pt-2 border-t border-gray-700">
          <span className="text-xs text-gray-500">Call ID:</span>
          <p className="text-xs font-mono text-gray-400 mt-1">{displayCall.id}</p>
        </div>
      </div>
    </Modal>
  );
};
