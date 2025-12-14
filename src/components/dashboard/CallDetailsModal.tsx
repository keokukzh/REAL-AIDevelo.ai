import React from 'react';
import { Modal } from '../ui/Modal';
import { Phone, Clock, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface Call {
  id: string;
  direction: string;
  from_e164: string | null;
  to_e164: string | null;
  started_at: string;
  ended_at: string | null;
  duration_sec: number | null;
  outcome: string | null;
  notes_json?: any;
}

interface CallDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  call: Call | null;
}

export const CallDetailsModal: React.FC<CallDetailsModalProps> = ({ isOpen, onClose, call }) => {
  if (!call) return null;

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
    if (!call.outcome) return null;
    const outcome = call.outcome.toLowerCase();
    if (outcome.includes('success') || outcome.includes('completed')) {
      return <CheckCircle className="text-green-400" size={20} />;
    } else if (outcome.includes('failed') || outcome.includes('error')) {
      return <XCircle className="text-red-400" size={20} />;
    }
    return <AlertCircle className="text-yellow-400" size={20} />;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Anruf-Details" size="md">
      <div className="space-y-4">
        {/* Direction Badge */}
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            call.direction === 'inbound'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
          }`}>
            {call.direction === 'inbound' ? 'Eingehend' : 'Ausgehend'}
          </span>
          {getOutcomeIcon()}
        </div>

        {/* Phone Numbers */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Phone size={16} className="text-gray-400" />
              <span className="text-xs text-gray-400">Von</span>
            </div>
            <p className="text-sm font-mono">{formatPhoneNumber(call.from_e164)}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Phone size={16} className="text-gray-400" />
              <span className="text-xs text-gray-400">Nach</span>
            </div>
            <p className="text-sm font-mono">{formatPhoneNumber(call.to_e164)}</p>
          </div>
        </div>

        {/* Timestamps */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Calendar size={16} className="text-gray-400" />
            <div>
              <span className="text-xs text-gray-400">Gestartet:</span>
              <p className="text-sm">{formatDateTime(call.started_at)}</p>
            </div>
          </div>
          {call.ended_at && (
            <div className="flex items-center gap-3">
              <Calendar size={16} className="text-gray-400" />
              <div>
                <span className="text-xs text-gray-400">Beendet:</span>
                <p className="text-sm">{formatDateTime(call.ended_at)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Duration */}
        <div className="flex items-center gap-3 bg-gray-800 rounded-lg p-4 border border-gray-700">
          <Clock size={16} className="text-gray-400" />
          <div>
            <span className="text-xs text-gray-400">Dauer:</span>
            <p className="text-sm font-medium">{formatDuration(call.duration_sec)}</p>
          </div>
        </div>

        {/* Outcome */}
        {call.outcome && (
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <span className="text-xs text-gray-400">Ergebnis:</span>
            <p className="text-sm mt-1">{call.outcome}</p>
          </div>
        )}

        {/* Notes (if available) */}
        {call.notes_json && typeof call.notes_json === 'object' && Object.keys(call.notes_json).length > 0 && (
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <span className="text-xs text-gray-400">Notizen:</span>
            <pre className="text-xs mt-2 text-gray-300 overflow-auto">
              {JSON.stringify(call.notes_json, null, 2)}
            </pre>
          </div>
        )}

        {/* Call ID */}
        <div className="pt-2 border-t border-gray-700">
          <span className="text-xs text-gray-500">Call ID:</span>
          <p className="text-xs font-mono text-gray-400 mt-1">{call.id}</p>
        </div>
      </div>
    </Modal>
  );
};
