import React from 'react';
import { Activity, Phone, CheckCircle, AlertCircle } from 'lucide-react';

export interface DashboardStats {
  activeAgents: number;
  totalAgents: number;
  callsToday: number;
  successRate: number;
  missedCalls?: number;
}

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color: 'blue' | 'green' | 'orange' | 'red';
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  color,
}) => {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-500',
    green: 'bg-green-500/10 text-green-500',
    orange: 'bg-orange-500/10 text-orange-500',
    red: 'bg-red-500/10 text-red-500',
  };

  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-gray-400',
  };

  return (
    <div className="bg-surface border border-white/10 rounded-lg p-6 hover:border-white/20 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-400 mb-2">{title}</p>
          <p className="text-3xl font-bold text-white mb-1">{value}</p>
          {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
          {trend && trendValue && (
            <p className={`text-sm mt-2 ${trendColors[trend]}`}>
              {trend === 'up' && '↑ '}
              {trend === 'down' && '↓ '}
              {trendValue}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

interface KPIOverviewProps {
  stats: DashboardStats;
  loading?: boolean;
}

export const KPIOverview: React.FC<KPIOverviewProps> = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-surface border border-white/10 rounded-lg p-6 animate-pulse"
          >
            <div className="h-4 bg-white/10 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-white/10 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-white/10 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <KPICard
        title="Ihre Agents"
        value={stats.totalAgents}
        subtitle={`${stats.activeAgents} aktiv, 24/7 einsatzbereit`}
        icon={<Activity size={24} />}
        color="blue"
      />
      
      <KPICard
        title="Anrufe heute"
        value={stats.callsToday}
        subtitle="Gesamt bearbeitet"
        icon={<Phone size={24} />}
        color="green"
        trend={stats.callsToday > 0 ? 'up' : 'neutral'}
        trendValue={stats.callsToday > 0 ? `${stats.callsToday} Calls` : 'Keine Anrufe'}
      />
      
      <KPICard
        title="Erfolgsrate"
        value={`${stats.successRate}%`}
        subtitle="Erfolgreich abgeschlossen"
        icon={<CheckCircle size={24} />}
        color={stats.successRate >= 80 ? 'green' : stats.successRate >= 50 ? 'orange' : 'red'}
        trend={stats.successRate >= 80 ? 'up' : stats.successRate >= 50 ? 'neutral' : 'down'}
        trendValue={stats.successRate >= 80 ? 'Sehr gut' : stats.successRate >= 50 ? 'Durchschnittlich' : 'Verbesserung nötig'}
      />
      
      <KPICard
        title="Verpasste Anrufe"
        value={stats.missedCalls || 0}
        subtitle="Nicht beantwortet"
        icon={<AlertCircle size={24} />}
        color={stats.missedCalls && stats.missedCalls > 0 ? 'red' : 'green'}
        trend={stats.missedCalls && stats.missedCalls > 0 ? 'down' : 'neutral'}
        trendValue={stats.missedCalls && stats.missedCalls > 0 ? 'Aufmerksamkeit erforderlich' : 'Alles OK'}
      />
    </div>
  );
};
