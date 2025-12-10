import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { 
  BarChart, 
  TrendingUp, 
  TrendingDown,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  Calendar,
  Filter
} from 'lucide-react';
import { apiRequest, ApiRequestError } from '../../services/api';

interface AgentAnalytics {
  agentId: string;
  period: {
    start: string;
    end: string;
  };
  metrics: {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    avgDuration: number;
    avgSatisfaction?: number;
    callsByDay: Array<{
      date: string;
      count: number;
    }>;
    callsByHour: Array<{
      hour: number;
      count: number;
    }>;
    successRate: number;
  };
}

interface AnalyticsTabProps {
  agentId: string;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ agentId }) => {
  const [analytics, setAnalytics] = useState<AgentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, [agentId, dateRange, customStartDate, customEndDate]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      let startDate: string;
      let endDate: string = new Date().toISOString().split('T')[0];

      switch (dateRange) {
        case '7d':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case '30d':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case '90d':
          startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case 'custom':
          startDate = customStartDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          endDate = customEndDate || new Date().toISOString().split('T')[0];
          break;
        default:
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      }

      const res = await apiRequest<{ data: AgentAnalytics }>(
        `/agents/${agentId}/analytics?startDate=${startDate}&endDate=${endDate}`
      );
      setAnalytics(res.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      // Set mock data for development
      setAnalytics({
        agentId,
        period: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        },
        metrics: {
          totalCalls: 0,
          successfulCalls: 0,
          failedCalls: 0,
          avgDuration: 0,
          successRate: 0,
          callsByDay: [],
          callsByHour: [],
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!analytics) return;

    const csv = [
      ['Metric', 'Value'],
      ['Total Calls', analytics.metrics.totalCalls],
      ['Successful Calls', analytics.metrics.successfulCalls],
      ['Failed Calls', analytics.metrics.failedCalls],
      ['Success Rate', `${analytics.metrics.successRate}%`],
      ['Avg Duration', `${analytics.metrics.avgDuration}s`],
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${agentId}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12 text-gray-400">
        Keine Analytics-Daten verfügbar.
      </div>
    );
  }

  const { metrics } = analytics;

  return (
    <div className="space-y-6">
      {/* Date Range Picker */}
      <div className="bg-surface rounded-xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Calendar size={20} />
            Zeitraum
          </h3>
          <Button variant="outline" onClick={handleExport} className="flex items-center gap-2">
            <Download size={16} />
            Exportieren
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['7d', '30d', '90d', 'custom'] as const).map((range) => (
            <Button
              key={range}
              variant={dateRange === range ? 'primary' : 'outline'}
              onClick={() => setDateRange(range)}
              className="text-sm"
            >
              {range === '7d' ? '7 Tage' : range === '30d' ? '30 Tage' : range === '90d' ? '90 Tage' : 'Benutzerdefiniert'}
            </Button>
          ))}
        </div>
        {dateRange === 'custom' && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Von</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Bis</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface rounded-xl border border-white/10 p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Total Anrufe</span>
            <Phone className="text-accent" size={20} />
          </div>
          <div className="text-3xl font-bold">{metrics.totalCalls}</div>
          <div className="text-xs text-gray-500 mt-2">
            {metrics.successfulCalls} erfolgreich, {metrics.failedCalls} fehlgeschlagen
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface rounded-xl border border-white/10 p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Erfolgsrate</span>
            <TrendingUp className="text-green-400" size={20} />
          </div>
          <div className="text-3xl font-bold text-green-400">{metrics.successRate.toFixed(1)}%</div>
          <div className="text-xs text-gray-500 mt-2">
            {metrics.successfulCalls} von {metrics.totalCalls} Anrufen
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface rounded-xl border border-white/10 p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Ø Dauer</span>
            <Clock className="text-blue-400" size={20} />
          </div>
          <div className="text-3xl font-bold">{formatDuration(metrics.avgDuration)}</div>
          <div className="text-xs text-gray-500 mt-2">Durchschnittliche Anrufdauer</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-surface rounded-xl border border-white/10 p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Zufriedenheit</span>
            {metrics.avgSatisfaction !== undefined ? (
              metrics.avgSatisfaction >= 80 ? (
                <CheckCircle className="text-green-400" size={20} />
              ) : (
                <XCircle className="text-yellow-400" size={20} />
              )
            ) : (
              <Clock className="text-gray-400" size={20} />
            )}
          </div>
          <div className="text-3xl font-bold">
            {metrics.avgSatisfaction !== undefined ? `${metrics.avgSatisfaction}%` : 'N/A'}
          </div>
          <div className="text-xs text-gray-500 mt-2">Durchschnittliche Bewertung</div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calls by Day */}
        <div className="bg-surface rounded-xl border border-white/10 p-6">
          <h3 className="text-lg font-bold mb-4">Anrufe nach Tag</h3>
          {metrics.callsByDay.length > 0 ? (
            <div className="space-y-2">
              {metrics.callsByDay.map((day, index) => {
                const maxCalls = Math.max(...metrics.callsByDay.map(d => d.count));
                const percentage = maxCalls > 0 ? (day.count / maxCalls) * 100 : 0;
                return (
                  <div key={index} className="flex items-center gap-4">
                    <span className="text-sm text-gray-400 w-24">
                      {new Date(day.date).toLocaleDateString('de-CH', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                    </span>
                    <div className="flex-1 bg-white/5 rounded-full h-6 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-accent h-full rounded-full"
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">{day.count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">Keine Daten verfügbar</div>
          )}
        </div>

        {/* Calls by Hour */}
        <div className="bg-surface rounded-xl border border-white/10 p-6">
          <h3 className="text-lg font-bold mb-4">Anrufe nach Stunde</h3>
          {metrics.callsByHour.length > 0 ? (
            <div className="space-y-2">
              {metrics.callsByHour.map((hour, index) => {
                const maxCalls = Math.max(...metrics.callsByHour.map(h => h.count));
                const percentage = maxCalls > 0 ? (hour.count / maxCalls) * 100 : 0;
                return (
                  <div key={index} className="flex items-center gap-4">
                    <span className="text-sm text-gray-400 w-16">
                      {hour.hour.toString().padStart(2, '0')}:00
                    </span>
                    <div className="flex-1 bg-white/5 rounded-full h-6 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-blue-500 h-full rounded-full"
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">{hour.count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">Keine Daten verfügbar</div>
          )}
        </div>
      </div>
    </div>
  );
};

