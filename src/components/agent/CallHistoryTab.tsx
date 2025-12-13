import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { DataTable } from '../ui/DataTable';
import { 
  Phone, 
  Clock, 
  CheckCircle, 
  XCircle, 
  PhoneOff,
  Voicemail,
  Filter,
  Eye,
  Download,
  Play,
  Calendar,
  Search,
  RefreshCw
} from 'lucide-react';
import { apiRequest, ApiRequestError } from '../../services/api';

interface CallHistory {
  id: string;
  agentId: string;
  phoneNumber?: string;
  callerNumber?: string;
  startTime: Date | string;
  endTime?: Date | string;
  duration?: number;
  status: 'completed' | 'failed' | 'missed' | 'voicemail';
  transcript?: string;
  audioUrl?: string;
  recordingUrl?: string;
  metadata?: {
    satisfaction?: number;
    notes?: string;
    tags?: string[];
  };
}

interface CallHistoryTabProps {
  agentId: string;
}

export const CallHistoryTab: React.FC<CallHistoryTabProps> = ({ agentId }) => {
  const [calls, setCalls] = useState<CallHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState<CallHistory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  useEffect(() => {
    fetchCalls();
  }, [agentId]);

  const fetchCalls = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ data: CallHistory[] }>(`/agents/${agentId}/calls`);
      setCalls(res.data);
    } catch (error) {
      console.error('Failed to fetch call history:', error);
      // Set empty array on error
      setCalls([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: CallHistory['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-green-400" size={16} />;
      case 'failed':
        return <XCircle className="text-red-400" size={16} />;
      case 'missed':
        return <PhoneOff className="text-yellow-400" size={16} />;
      case 'voicemail':
        return <Voicemail className="text-blue-400" size={16} />;
      default:
        return <Clock className="text-gray-400" size={16} />;
    }
  };

  const getStatusLabel = (status: CallHistory['status']) => {
    const labels = {
      completed: 'Abgeschlossen',
      failed: 'Fehlgeschlagen',
      missed: 'Verpasst',
      voicemail: 'Voicemail',
    };
    return labels[status] || status;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredCalls = calls.filter((call) => {
    const matchesSearch = !searchQuery.trim() || 
      call.callerNumber?.includes(searchQuery) ||
      call.phoneNumber?.includes(searchQuery) ||
      call.transcript?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = !statusFilter || call.status === statusFilter;
    
    const matchesDate = (() => {
      if (dateFilter === 'all') return true;
      const callDate = new Date(call.startTime);
      const now = new Date();
      const diff = now.getTime() - callDate.getTime();
      
      switch (dateFilter) {
        case 'today':
          return diff < 24 * 60 * 60 * 1000;
        case 'week':
          return diff < 7 * 24 * 60 * 60 * 1000;
        case 'month':
          return diff < 30 * 24 * 60 * 60 * 1000;
        default:
          return true;
      }
    })();

    return matchesSearch && matchesStatus && matchesDate;
  });

  const columns = [
    {
      key: 'startTime',
      header: 'Zeitpunkt',
      accessor: (call: CallHistory) => (
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-gray-400" />
          <span>{formatDate(call.startTime)}</span>
        </div>
      ),
    },
    {
      key: 'callerNumber',
      header: 'Anrufer',
      accessor: (call: CallHistory) => (
        <div className="flex items-center gap-2">
          <Phone size={14} className="text-gray-400" />
          <span>{call.callerNumber || 'Unbekannt'}</span>
        </div>
      ),
    },
    {
      key: 'duration',
      header: 'Dauer',
      accessor: (call: CallHistory) => formatDuration(call.duration),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (call: CallHistory) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(call.status)}
          <span>{getStatusLabel(call.status)}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Aktionen',
      accessor: (call: CallHistory) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCall(call);
            }}
            className="p-2"
          >
            <Eye size={14} />
          </Button>
          {call.audioUrl && (
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                window.open(call.audioUrl, '_blank');
              }}
              className="p-2"
            >
              <Play size={14} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-surface rounded-xl border border-white/10 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Nach Anrufer, Nummer oder Transkript suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:border-accent focus:outline-none"
            />
          </div>
          <select
            value={statusFilter || ''}
            onChange={(e) => setStatusFilter(e.target.value || null)}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent focus:outline-none"
          >
            <option value="">Alle Status</option>
            <option value="completed">Abgeschlossen</option>
            <option value="failed">Fehlgeschlagen</option>
            <option value="missed">Verpasst</option>
            <option value="voicemail">Voicemail</option>
          </select>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent focus:outline-none"
          >
            <option value="all">Alle Zeiträume</option>
            <option value="today">Heute</option>
            <option value="week">Letzte 7 Tage</option>
            <option value="month">Letzte 30 Tage</option>
          </select>
        </div>
      </div>

      {/* Call History Table */}
      <div className="bg-surface rounded-xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Anrufhistorie ({filteredCalls.length})</h3>
          <Button variant="outline" onClick={fetchCalls} className="flex items-center gap-2">
            <RefreshCw size={16} />
            Aktualisieren
          </Button>
        </div>
        {loading ? (
          <div className="text-center py-12 text-gray-400">Lade Anrufhistorie...</div>
        ) : filteredCalls.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            {calls.length === 0 ? 'Noch keine Anrufe aufgezeichnet.' : 'Keine Anrufe gefunden, die den Filtern entsprechen.'}
          </div>
        ) : (
          <DataTable
            data={filteredCalls}
            columns={columns}
            onRowClick={(call) => setSelectedCall(call)}
          />
        )}
      </div>

      {/* Call Detail Modal */}
      {selectedCall && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface rounded-xl border border-white/10 p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Anruf Details</h3>
              <Button variant="outline" onClick={() => setSelectedCall(null)}>
                <XCircle size={20} />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-400">Anrufer</span>
                  <p className="font-medium">{selectedCall.callerNumber || 'Unbekannt'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-400">Agent Nummer</span>
                  <p className="font-medium">{selectedCall.phoneNumber || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-400">Startzeit</span>
                  <p className="font-medium">{formatDate(selectedCall.startTime)}</p>
                </div>
                {selectedCall.endTime && (
                  <div>
                    <span className="text-sm text-gray-400">Endzeit</span>
                    <p className="font-medium">{formatDate(selectedCall.endTime)}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-gray-400">Dauer</span>
                  <p className="font-medium">{formatDuration(selectedCall.duration)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-400">Status</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedCall.status)}
                    <span>{getStatusLabel(selectedCall.status)}</span>
                  </div>
                </div>
              </div>

              {selectedCall.metadata?.satisfaction !== undefined && (
                <div>
                  <span className="text-sm text-gray-400">Zufriedenheit</span>
                  <p className="font-medium">{selectedCall.metadata.satisfaction}%</p>
                </div>
              )}

              {selectedCall.transcript && (
                <div>
                  <span className="text-sm text-gray-400 mb-2 block">Transkript</span>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{selectedCall.transcript}</p>
                  </div>
                </div>
              )}

              {selectedCall.metadata?.notes && (
                <div>
                  <span className="text-sm text-gray-400 mb-2 block">Notizen</span>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <p className="text-sm text-gray-300">{selectedCall.metadata.notes}</p>
                  </div>
                </div>
              )}

              {selectedCall.metadata?.tags && selectedCall.metadata.tags.length > 0 && (
                <div>
                  <span className="text-sm text-gray-400 mb-2 block">Tags</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedCall.metadata.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-accent/20 text-accent rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-white/10">
                {selectedCall.audioUrl && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(selectedCall.audioUrl, '_blank')}
                    className="flex items-center gap-2"
                  >
                    <Play size={16} />
                    Audio abspielen
                  </Button>
                )}
                {selectedCall.recordingUrl && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(selectedCall.recordingUrl, '_blank')}
                    className="flex items-center gap-2"
                  >
                    <Download size={16} />
                    Aufnahme herunterladen
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

