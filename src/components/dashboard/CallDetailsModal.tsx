import React from 'react';
import { Modal } from '../ui/Modal';
import { Phone, Clock, Calendar, CheckCircle, XCircle, AlertCircle, ExternalLink, Copy } from 'lucide-react';
import { useCallDetails } from '../../hooks/useCallDetails';
import { CallLog } from '../../hooks/useCallLogs';
import { toast } from '../ui/Toast';

interface CallDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  call: CallLog | null;
  callSid?: string | null; // Optional: if provided, will lazy load details
}

export const CallDetailsModal: React.FC<CallDetailsModalProps> = ({ isOpen, onClose, call, callSid }) => {
  // If callSid is provided but call is not, lazy load it
  const { data: lazyCall, isLoading: isLoadingDetails } = useCallDetails(callSid || null);
  const displayCall = call || lazyCall;

  const handleCopyCallSid = async () => {
    if (!displayCall?.callSid) return;
    try {
      await navigator.clipboard.writeText(displayCall.callSid);
      toast.success('Call SID kopiert');
    } catch (err) {
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
      document.body.removeChild(textArea);
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
  const notes = displayCall.notes || {};
  const transcript = notes.transcript || notes.transcription || null;
  const recordingUrl = notes.recordingUrl || notes.recording_url || null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Anruf-Details" size="lg">
      <div className="space-y-4">
        {/* Header: Call SID + Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              displayCall.direction === 'inbound'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
            }`}>
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

        {/* Notes (if available and not already shown as transcript) */}
        {notes && typeof notes === 'object' && Object.keys(notes).length > 0 && !transcript && (
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Notizen</h3>
            <pre className="text-xs text-gray-300 overflow-auto max-h-48">
              {JSON.stringify(notes, null, 2)}
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
