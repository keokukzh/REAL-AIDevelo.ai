import React, { useState, useMemo } from 'react';
import { useCallLogs, CallLog } from '../hooks/useCallLogs';
import { CallDetailsModal } from '../components/dashboard/CallDetailsModal';
import { SideNav } from '../components/dashboard/SideNav';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Phone, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

export const CallsPage = () => {
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null);
  const [isCallDetailsOpen, setIsCallDetailsOpen] = useState(false);
  
  // Filter state
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState<'inbound' | 'outbound' | ''>('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const limit = 20;

  // Build query params
  const queryParams = useMemo(() => ({
    limit,
    offset: page * limit,
    ...(direction && { direction }),
    ...(status && { status }),
    ...(dateFrom && { dateFrom }),
    ...(dateTo && { dateTo }),
    ...(search && { search }),
  }), [page, limit, direction, status, dateFrom, dateTo, search]);

  const { data, isLoading, error } = useCallLogs(queryParams);

  const handleCallClick = (call: CallLog) => {
    setSelectedCall(call);
    setIsCallDetailsOpen(true);
  };

  const handleCloseModal = () => {
    setIsCallDetailsOpen(false);
    setSelectedCall(null);
  };

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
    });
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 0;
  const startItem = page * limit + 1;
  const endItem = data ? Math.min((page + 1) * limit, data.total) : 0;

  return (
    <div className="min-h-screen bg-background text-white flex">
      {/* Side Navigation */}
      <SideNav />

      {/* Main Content */}
      <div className="flex-1 p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Anrufe</h1>
          <p className="text-gray-400">Verwalte und durchsuche alle Anrufe</p>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={18} className="text-gray-400" />
            <h2 className="text-lg font-semibold">Filter</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label htmlFor="search-filter" className="block text-xs text-gray-400 mb-2">Suche (Call SID / Nummer)</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  id="search-filter"
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(0); // Reset to first page
                  }}
                  placeholder="CA123..."
                  className="w-full pl-10 pr-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* Direction */}
            <div>
              <label htmlFor="direction-filter" className="block text-xs text-gray-400 mb-2">Richtung</label>
              <select
                id="direction-filter"
                value={direction}
                onChange={(e) => {
                  setDirection(e.target.value as 'inbound' | 'outbound' | '');
                  setPage(0);
                }}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-white focus:outline-none focus:border-accent"
              >
                <option value="">Alle</option>
                <option value="inbound">Eingehend</option>
                <option value="outbound">Ausgehend</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status-filter" className="block text-xs text-gray-400 mb-2">Status</label>
              <select
                id="status-filter"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(0);
                }}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-white focus:outline-none focus:border-accent"
              >
                <option value="">Alle</option>
                <option value="completed">Abgeschlossen</option>
                <option value="failed">Fehlgeschlagen</option>
                <option value="busy">Besetzt</option>
                <option value="no-answer">Keine Antwort</option>
                <option value="queued">In Warteschlange</option>
                <option value="ringing">Klingelt</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <label htmlFor="date-from-filter" className="block text-xs text-gray-400 mb-2">Von Datum</label>
              <input
                id="date-from-filter"
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(0);
                }}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-white focus:outline-none focus:border-accent"
              />
            </div>

            {/* Date To */}
            <div>
              <label htmlFor="date-to-filter" className="block text-xs text-gray-400 mb-2">Bis Datum</label>
              <input
                id="date-to-filter"
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(0);
                }}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-white focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Clear Filters */}
          {(direction || status || dateFrom || dateTo || search) && (
            <div className="mt-4">
              <button
                onClick={() => {
                  setDirection('');
                  setStatus('');
                  setDateFrom('');
                  setDateTo('');
                  setSearch('');
                  setPage(0);
                }}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Filter zurücksetzen
              </button>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <p className="text-red-300">{error.message || 'Fehler beim Laden der Anrufe'}</p>
          </div>
        )}

        {/* Calls Table */}
        {!isLoading && !error && data && (
          <>
            {data.items.length === 0 ? (
              <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700">
                <Phone size={48} className="mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400 mb-2">Keine Anrufe gefunden</p>
                <p className="text-sm text-gray-500">
                  {direction || status || dateFrom || dateTo || search
                    ? 'Versuche andere Filter'
                    : 'Noch keine Anrufe vorhanden'}
                </p>
              </div>
            ) : (
              <>
                <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Zeitpunkt</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Richtung</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Von</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Nach</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Dauer</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Call SID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.items.map((call) => (
                          <tr
                            key={call.id}
                            className="border-b border-gray-700/50 hover:bg-gray-700/30 cursor-pointer transition-colors"
                            onClick={() => handleCallClick(call)}
                          >
                            <td className="py-3 px-4 text-sm text-gray-300">
                              {formatDateTime(call.started_at)}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded text-xs ${
                                call.direction === 'inbound'
                                  ? 'bg-blue-500/20 text-blue-300'
                                  : 'bg-purple-500/20 text-purple-300'
                              }`}>
                                {call.direction === 'inbound' ? 'Eingehend' : 'Ausgehend'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm font-mono">{formatPhoneNumber(call.from_e164)}</td>
                            <td className="py-3 px-4 text-sm font-mono">{formatPhoneNumber(call.to_e164)}</td>
                            <td className="py-3 px-4 text-sm text-gray-300">{formatDuration(call.duration_sec)}</td>
                            <td className="py-3 px-4">
                              {call.outcome ? (
                                <span className="px-2 py-1 rounded text-xs bg-gray-700 text-gray-300">
                                  {call.outcome}
                                </span>
                              ) : (
                                <span className="text-gray-500 text-xs">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-xs font-mono text-gray-400">
                              {call.callSid.substring(0, 12)}...
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-400">
                      Zeige {startItem}–{endItem} von {data.total} Anrufen
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPage(Math.max(0, page - 1))}
                        disabled={page === 0}
                        className="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <ChevronLeft size={16} />
                        Zurück
                      </button>
                      <span className="text-sm text-gray-400">
                        Seite {page + 1} von {totalPages}
                      </span>
                      <button
                        onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                        disabled={page >= totalPages - 1}
                        className="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        Weiter
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Call Details Modal */}
        <CallDetailsModal
          isOpen={isCallDetailsOpen}
          onClose={handleCloseModal}
          call={selectedCall}
        />
      </div>
    </div>
  );
};
