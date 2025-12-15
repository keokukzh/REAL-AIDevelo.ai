import React, { useState, useMemo } from 'react';
import { useCallLogs, CallLog } from '../hooks/useCallLogs';
import { CallDetailsModal } from '../components/dashboard/CallDetailsModal';
import { SideNav } from '../components/dashboard/SideNav';
import { Phone, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '../components/newDashboard/ui/Input';
import { Select } from '../components/newDashboard/ui/Select';
import { SkeletonTable } from '../components/newDashboard/Skeleton';
import { EmptyCalls } from '../components/newDashboard/EmptyState';
import { Card } from '../components/newDashboard/ui/Card';

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
      <main className="flex-1 ml-64 flex flex-col min-w-0">
        <header className="h-16 bg-black/60 backdrop-blur-lg border-b border-white/10 flex items-center justify-between px-8 sticky top-0 z-40 shadow-lg">
          <div>
            <h1 className="text-2xl font-bold font-display text-white">Anrufe</h1>
            <p className="text-sm text-gray-400">Verwalte und durchsuche alle Anrufe</p>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full">

          {/* Filters */}
          <Card title="Filter" className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <Input
                label="Suche (Call SID / Nummer)"
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                placeholder="CA123..."
                icon={<Search size={16} />}
                size="sm"
              />

              {/* Direction */}
              <Select
                label="Richtung"
                value={direction}
                onChange={(e) => {
                  setDirection(e.target.value as 'inbound' | 'outbound' | '');
                  setPage(0);
                }}
                options={[
                  { value: '', label: 'Alle' },
                  { value: 'inbound', label: 'Eingehend' },
                  { value: 'outbound', label: 'Ausgehend' },
                ]}
                size="sm"
              />

              {/* Status */}
              <Select
                label="Status"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(0);
                }}
                options={[
                  { value: '', label: 'Alle' },
                  { value: 'completed', label: 'Abgeschlossen' },
                  { value: 'failed', label: 'Fehlgeschlagen' },
                  { value: 'busy', label: 'Besetzt' },
                  { value: 'no-answer', label: 'Keine Antwort' },
                  { value: 'queued', label: 'In Warteschlange' },
                  { value: 'ringing', label: 'Klingelt' },
                ]}
                size="sm"
              />

              {/* Date From */}
              <Input
                label="Von Datum"
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(0);
                }}
                size="sm"
              />

              {/* Date To */}
              <Input
                label="Bis Datum"
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(0);
                }}
                size="sm"
              />
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
                  className="text-sm text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-slate-900 rounded px-2 py-1"
                  aria-label="Filter zurücksetzen"
                >
                  Filter zurücksetzen
                </button>
              </div>
            )}
          </Card>

          {/* Loading State */}
          {isLoading && (
            <Card>
              <SkeletonTable rows={10} />
            </Card>
          )}

          {/* Error State */}
          {error && (
            <Card className="border-red-500/30 bg-red-500/10">
              <div className="text-center py-4">
                <p className="text-red-300 font-medium mb-2">Fehler beim Laden der Anrufe</p>
                <p className="text-sm text-red-400">{error.message || 'Unbekannter Fehler'}</p>
              </div>
            </Card>
          )}

          {/* Calls Table */}
          {!isLoading && !error && data && (
            <>
              {data.items.length === 0 ? (
                <Card>
                  <EmptyCalls />
                </Card>
              ) : (
                <Card title={`${data.total} Anruf${data.total !== 1 ? 'e' : ''} gefunden`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left" role="table" aria-label="Anrufliste">
                      <thead>
                        <tr className="border-b border-slate-700/50">
                          <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Zeitpunkt</th>
                          <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Richtung</th>
                          <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Von</th>
                          <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Nach</th>
                          <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Dauer</th>
                          <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Status</th>
                          <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Call SID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.items.map((call) => (
                          <tr
                            key={call.id}
                            role="row"
                            className="border-b border-slate-700/50 hover:bg-slate-800/50 cursor-pointer transition-colors"
                            onClick={() => handleCallClick(call)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleCallClick(call);
                              }
                            }}
                            tabIndex={0}
                            aria-label={`Anruf von ${formatPhoneNumber(call.from_e164)} am ${formatDateTime(call.started_at)}`}
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
                      <div className="flex items-center justify-between mt-6 border-t border-slate-700/50 pt-4">
                        <div className="text-sm text-gray-400" role="status" aria-live="polite">
                          Zeige {startItem}–{endItem} von {data.total} Anrufen
                        </div>
                        <nav aria-label="Pagination">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setPage(Math.max(0, page - 1))}
                              disabled={page === 0}
                              className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 text-white rounded hover:bg-slate-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-slate-900"
                              aria-label="Vorherige Seite"
                            >
                              <ChevronLeft size={16} aria-hidden="true" />
                              Zurück
                            </button>
                            <span className="text-sm text-gray-400">
                              Seite {page + 1} von {totalPages}
                            </span>
                            <button
                              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                              disabled={page >= totalPages - 1}
                              className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 text-white rounded hover:bg-slate-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-slate-900"
                              aria-label="Nächste Seite"
                            >
                              Weiter
                              <ChevronRight size={16} aria-hidden="true" />
                            </button>
                          </div>
                        </nav>
                      </div>
                    )}
                  </Card>
                )}
              </>
            )}
          )}

          {/* Call Details Modal */}
          <CallDetailsModal
            isOpen={isCallDetailsOpen}
            onClose={handleCloseModal}
            call={selectedCall}
          />
        </div>
      </main>
    </div>
  );
};
