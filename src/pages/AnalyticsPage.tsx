import React, { useState, useMemo } from 'react';
import { SideNav } from '../components/dashboard/SideNav';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useCallsSummary, useTopSources, CallsSummaryFilters, TopSourcesFilters } from '../hooks/useCallAnalytics';
import { exportCsv, exportPdf, ExportFilters } from '../hooks/useCallAnalyticsExport';
import { useScheduledReports, useCreateScheduledReport, useUpdateScheduledReport, useDeleteScheduledReport, useTestScheduledReport } from '../hooks/useScheduledReports';
import { Filter, RefreshCw, AlertCircle, BarChart3, Database, Clock, CheckCircle, FileText, Bot, Download, Mail, Plus, Trash2, Play, Calendar } from 'lucide-react';
import { toast } from '../components/ui/Toast';

export const AnalyticsPage = () => {
  // Filter state
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [direction, setDirection] = useState<'inbound' | 'outbound' | ''>('');
  const [outcome, setOutcome] = useState('');

  // Build filters
  const summaryFilters: CallsSummaryFilters = useMemo(() => ({
    ...(dateFrom && { dateFrom }),
    ...(dateTo && { dateTo }),
    ...(direction && { direction: direction as 'inbound' | 'outbound' }),
    ...(outcome && { outcome }),
  }), [dateFrom, dateTo, direction, outcome]);

  const topSourcesFilters: TopSourcesFilters = useMemo(() => ({
    ...(dateFrom && { dateFrom }),
    ...(dateTo && { dateTo }),
    limit: 10,
  }), [dateFrom, dateTo]);

  const { data: summary, isLoading: isLoadingSummary, error: summaryError, refetch: refetchSummary } = useCallsSummary(summaryFilters);
  const { data: topSources, isLoading: isLoadingSources, error: sourcesError, refetch: refetchSources } = useTopSources(topSourcesFilters);

  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Scheduled Reports
  const { data: scheduledReports, isLoading: isLoadingReports } = useScheduledReports();
  const createReport = useCreateScheduledReport();
  const updateReport = useUpdateScheduledReport();
  const deleteReport = useDeleteScheduledReport();
  const testReport = useTestScheduledReport();
  const [showNewReportForm, setShowNewReportForm] = useState(false);
  const [newReportFrequency, setNewReportFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [newReportRecipients, setNewReportRecipients] = useState('');

  const handleRefetch = () => {
    refetchSummary();
    refetchSources();
  };

  const handleExportCsv = async () => {
    setIsExportingCsv(true);
    try {
      const exportFilters: ExportFilters = {
        ...summaryFilters,
        limit: 10000,
      };
      await exportCsv(exportFilters);
      toast.success('CSV Export erfolgreich');
    } catch (error: any) {
      console.error('CSV Export error:', error);
      toast.error(error.message || 'CSV Export fehlgeschlagen');
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      const exportFilters: ExportFilters = {
        ...summaryFilters,
        limitSources: 10,
      };
      await exportPdf(exportFilters);
      toast.success('PDF Export erfolgreich');
    } catch (error: any) {
      console.error('PDF Export error:', error);
      toast.error(error.message || 'PDF Export fehlgeschlagen');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    if (seconds === 0) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="min-h-screen bg-background text-white flex">
      {/* Side Navigation */}
      <SideNav />

      {/* Main Content */}
      <div className="flex-1 p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <BarChart3 size={32} />
              Analytics
            </h1>
            <p className="text-gray-400">Call-Qualität & RAG-Nutzung pro Location</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              disabled={isExportingCsv || isExportingPdf}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={16} className={isExportingCsv ? 'animate-pulse' : ''} />
              {isExportingCsv ? 'Exportiere...' : 'Export CSV'}
            </button>
            <button
              onClick={handleExportPdf}
              disabled={isExportingCsv || isExportingPdf}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={16} className={isExportingPdf ? 'animate-pulse' : ''} />
              {isExportingPdf ? 'Exportiere...' : 'Export PDF'}
            </button>
            <button
              onClick={handleRefetch}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-colors"
              disabled={isLoadingSummary || isLoadingSources}
            >
              <RefreshCw size={16} className={isLoadingSummary || isLoadingSources ? 'animate-spin' : ''} />
              Aktualisieren
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={18} className="text-gray-400" />
            <h2 className="text-lg font-semibold">Filter</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date From */}
            <div>
              <label htmlFor="date-from" className="block text-xs text-gray-400 mb-2">Von Datum</label>
              <input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-accent"
              />
            </div>

            {/* Date To */}
            <div>
              <label htmlFor="date-to" className="block text-xs text-gray-400 mb-2">Bis Datum</label>
              <input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-accent"
              />
            </div>

            {/* Direction */}
            <div>
              <label htmlFor="direction" className="block text-xs text-gray-400 mb-2">Richtung</label>
              <select
                id="direction"
                value={direction}
                onChange={(e) => setDirection(e.target.value as 'inbound' | 'outbound' | '')}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-accent"
              >
                <option value="">Alle</option>
                <option value="inbound">Eingehend</option>
                <option value="outbound">Ausgehend</option>
              </select>
            </div>

            {/* Outcome */}
            <div>
              <label htmlFor="outcome" className="block text-xs text-gray-400 mb-2">Status</label>
              <select
                id="outcome"
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-accent"
              >
                <option value="">Alle</option>
                <option value="completed">Abgeschlossen</option>
                <option value="failed">Fehlgeschlagen</option>
                <option value="busy">Besetzt</option>
                <option value="no-answer">Keine Antwort</option>
                <option value="ringing">Klingelt</option>
                <option value="queued">In Warteschlange</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error States */}
        {(summaryError || sourcesError) && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle size={20} className="text-red-400" />
            <div>
              <p className="text-red-300 font-medium">Fehler beim Laden der Daten</p>
              <p className="text-red-400 text-sm mt-1">
                {summaryError?.message || sourcesError?.message || 'Unbekannter Fehler'}
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {(isLoadingSummary || isLoadingSources) && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        )}

        {/* Summary Cards */}
        {summary && !isLoadingSummary && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {/* Total Calls */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">Total Calls</span>
                  <BarChart3 size={16} className="text-gray-400" />
                </div>
                <p className="text-2xl font-bold">{summary.totals.calls}</p>
              </div>

              {/* Completion Rate */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">Completion Rate</span>
                  <CheckCircle size={16} className="text-green-400" />
                </div>
                <p className="text-2xl font-bold">
                  {summary.totals.calls > 0
                    ? formatPercentage((summary.totals.completed / summary.totals.calls) * 100)
                    : '0%'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {summary.totals.completed} von {summary.totals.calls}
                </p>
              </div>

              {/* Avg Duration */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">Ø Dauer</span>
                  <Clock size={16} className="text-gray-400" />
                </div>
                <p className="text-2xl font-bold">{formatDuration(summary.avgDurationSec)}</p>
              </div>

              {/* Transcript Coverage */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">Transcript Coverage</span>
                  <FileText size={16} className="text-gray-400" />
                </div>
                <p className="text-2xl font-bold">{formatPercentage(summary.transcriptCoverageRate)}</p>
              </div>

              {/* RAG Usage Rate */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">RAG Usage Rate</span>
                  <Database size={16} className="text-gray-400" />
                </div>
                <p className="text-2xl font-bold">{formatPercentage(summary.ragUsageRate)}</p>
              </div>

              {/* Eleven Coverage */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">ElevenLabs Coverage</span>
                  <Bot size={16} className="text-gray-400" />
                </div>
                <p className="text-2xl font-bold">{formatPercentage(summary.elevenCoverageRate)}</p>
              </div>
            </div>

            {/* RAG Averages */}
            {summary.ragAverages.avgQueries > 0 && (
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mb-6">
                <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <Database size={16} />
                  RAG Durchschnitte
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-xs text-gray-400">Ø Queries/Call</span>
                    <p className="text-lg font-medium">{summary.ragAverages.avgQueries.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">Ø Results/Call</span>
                    <p className="text-lg font-medium">{summary.ragAverages.avgResults.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">Ø Injected Chars/Call</span>
                    <p className="text-lg font-medium">{Math.round(summary.ragAverages.avgInjectedChars).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Top Sources Table */}
        {topSources && !isLoadingSources && (
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
              <Database size={16} />
              Top RAG Sources
            </h3>
            {topSources.items.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>Keine RAG Sources gefunden</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left text-gray-400 py-2 px-3">Title</th>
                      <th className="text-left text-gray-400 py-2 px-3">File</th>
                      <th className="text-left text-gray-400 py-2 px-3">Doc ID</th>
                      <th className="text-right text-gray-400 py-2 px-3">Count</th>
                      <th className="text-right text-gray-400 py-2 px-3">Ø Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topSources.items.map((item, idx) => (
                      <tr key={`${item.documentId}-${idx}`} className="border-b border-gray-800 hover:bg-gray-900/50">
                        <td className="py-2 px-3 text-gray-300">{item.title || '-'}</td>
                        <td className="py-2 px-3 text-gray-400 truncate max-w-[200px]" title={item.fileName}>
                          {item.fileName || '-'}
                        </td>
                        <td className="py-2 px-3 text-gray-400 font-mono text-xs truncate max-w-[150px]" title={item.documentId}>
                          {item.documentId}
                        </td>
                        <td className="py-2 px-3 text-gray-300 text-right">{item.count}</td>
                        <td className="py-2 px-3 text-gray-300 text-right font-mono">{item.avgScore.toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {summary && summary.totals.calls === 0 && !isLoadingSummary && (
          <div className="text-center py-12 text-gray-400">
            <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
            <p>Keine Calls gefunden für die ausgewählten Filter</p>
          </div>
        )}

        {/* Scheduled Reports Section */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <Mail size={16} />
              Geplante Reports
            </h3>
            <button
              onClick={() => setShowNewReportForm(!showNewReportForm)}
              className="flex items-center gap-2 px-3 py-1.5 bg-accent hover:bg-accent/80 rounded-lg text-sm transition-colors"
            >
              <Plus size={14} />
              Neu
            </button>
          </div>

          {/* New Report Form */}
          {showNewReportForm && (
            <div className="bg-gray-900/50 rounded-lg p-4 mb-4 border border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Frequenz</label>
                  <select
                    value={newReportFrequency}
                    onChange={(e) => setNewReportFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm"
                  >
                    <option value="daily">Täglich</option>
                    <option value="weekly">Wöchentlich</option>
                    <option value="monthly">Monatlich</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-400 mb-2">Empfänger (kommagetrennt)</label>
                  <input
                    type="text"
                    value={newReportRecipients}
                    onChange={(e) => setNewReportRecipients(e.target.value)}
                    placeholder="email1@example.com, email2@example.com"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (!newReportRecipients.trim()) {
                      toast.error('Bitte Empfänger eingeben');
                      return;
                    }
                    const recipients = newReportRecipients.split(',').map(r => r.trim()).filter(r => r);
                    try {
                      await createReport.mutateAsync({
                        frequency: newReportFrequency,
                        recipients,
                        filters: {
                          dateRangePreset: 'last7days',
                        },
                      });
                      toast.success('Geplanter Report erstellt');
                      setShowNewReportForm(false);
                      setNewReportRecipients('');
                    } catch (error: any) {
                      toast.error(error.message || 'Fehler beim Erstellen');
                    }
                  }}
                  disabled={createReport.isPending}
                  className="px-4 py-2 bg-accent hover:bg-accent/80 rounded-lg text-sm disabled:opacity-50"
                >
                  {createReport.isPending ? 'Erstelle...' : 'Erstellen'}
                </button>
                <button
                  onClick={() => {
                    setShowNewReportForm(false);
                    setNewReportRecipients('');
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          )}

          {/* Reports List */}
          {isLoadingReports ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : scheduledReports && scheduledReports.length > 0 ? (
            <div className="space-y-3">
              {scheduledReports.map((report) => (
                <div key={report.id} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${report.enabled ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-gray-700 text-gray-400 border border-gray-600'}`}>
                          {report.enabled ? 'Aktiv' : 'Deaktiviert'}
                        </span>
                        <span className="text-sm text-gray-300 capitalize">{report.frequency}</span>
                        <Calendar size={14} className="text-gray-400" />
                        {report.next_run_at && (
                          <span className="text-xs text-gray-400">
                            Nächster Lauf: {new Date(report.next_run_at).toLocaleDateString('de-DE')}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mb-2">
                        Empfänger: {report.recipients.join(', ')}
                      </div>
                      {report.last_run_at && (
                        <div className="text-xs text-gray-500">
                          Letzter Lauf: {new Date(report.last_run_at).toLocaleString('de-DE')}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          try {
                            await updateReport.mutateAsync({
                              id: report.id,
                              input: { enabled: !report.enabled },
                            });
                            toast.success(`Report ${report.enabled ? 'deaktiviert' : 'aktiviert'}`);
                          } catch (error: any) {
                            toast.error(error.message || 'Fehler');
                          }
                        }}
                        disabled={updateReport.isPending}
                        className="p-2 hover:bg-gray-700 rounded transition-colors"
                        title={report.enabled ? 'Deaktivieren' : 'Aktivieren'}
                      >
                        {report.enabled ? '✓' : '○'}
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await testReport.mutateAsync(report.id);
                            toast.success('Test-Report gesendet');
                          } catch (error: any) {
                            toast.error(error.message || 'Fehler beim Senden');
                          }
                        }}
                        disabled={testReport.isPending}
                        className="p-2 hover:bg-gray-700 rounded transition-colors"
                        title="Test senden"
                      >
                        <Play size={14} />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Report wirklich löschen?')) {
                            try {
                              await deleteReport.mutateAsync(report.id);
                              toast.success('Report gelöscht');
                            } catch (error: any) {
                              toast.error(error.message || 'Fehler beim Löschen');
                            }
                          }
                        }}
                        disabled={deleteReport.isPending}
                        className="p-2 hover:bg-red-500/20 rounded transition-colors text-red-400"
                        title="Löschen"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Mail size={32} className="mx-auto mb-2 opacity-50" />
              <p>Keine geplanten Reports</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
