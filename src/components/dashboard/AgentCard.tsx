import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Settings, Play, Pause, MoreVertical, CheckCircle, Clock } from 'lucide-react';
import { Button } from '../ui/Button';

export interface AgentCardData {
  id: string;
  name: string;
  industry: string;
  status: 'draft' | 'active' | 'inactive' | 'pending_activation';
  phoneNumber?: string;
  callsToday?: number;
  successRate?: number;
  isDefaultAgent?: boolean;
}

interface AgentCardProps {
  agent: AgentCardData;
  onTest?: (agentId: string) => void;
  onToggleStatus?: (agentId: string, newStatus: 'active' | 'inactive') => void;
  viewMode?: 'grid' | 'list';
}

interface CardViewProps {
  agent: AgentCardData;
  onTest: (e: React.MouseEvent) => void;
  onToggleStatus: (e: React.MouseEvent) => void;
  isToggleable: boolean;
}

const StatusBadge: React.FC<{ status: AgentCardData['status']; isDefault?: boolean }> = ({ status, isDefault }) => {
  const statusConfig = {
    draft: { label: 'Entwurf', color: 'bg-gray-500/20 text-gray-400', icon: Clock },
    active: { label: 'Aktiv', color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
    inactive: { label: 'Pausiert', color: 'bg-orange-500/20 text-orange-400', icon: Pause },
    pending_activation: { label: 'Aktivierung läuft', color: 'bg-blue-500/20 text-blue-400', icon: Clock },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon size={14} />
        {config.label}
      </span>
      {isDefault && (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-accent/20 text-accent border border-accent/30">
          Standard-Agent
        </span>
      )}
    </div>
  );
};

export const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  onTest,
  onToggleStatus,
  viewMode = 'grid',
}) => {
  const handleTest = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onTest?.(agent.id);
  };

  const handleToggleStatus = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newStatus = agent.status === 'active' ? 'inactive' : 'active';
    onToggleStatus?.(agent.id, newStatus);
  };

  const isToggleable = agent.status === 'active' || agent.status === 'inactive';

  return viewMode === 'list' ? (
    <ListViewCard
      agent={agent}
      onTest={handleTest}
      onToggleStatus={handleToggleStatus}
      isToggleable={isToggleable}
    />
  ) : (
    <GridViewCard
      agent={agent}
      onTest={handleTest}
      onToggleStatus={handleToggleStatus}
      isToggleable={isToggleable}
    />
  );
};

const ListViewCard: React.FC<CardViewProps> = ({ agent, onTest, onToggleStatus, isToggleable }) => (
  <Link
    to={`/dashboard/agents/${agent.id}`}
    className="block bg-surface border border-white/10 rounded-lg p-4 hover:border-accent/50 transition-all group"
  >
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-white truncate">{agent.name}</h3>
          <StatusBadge status={agent.status} isDefault={agent.isDefaultAgent} />
        </div>
        <p className="text-sm text-gray-400 mt-1">{agent.industry}</p>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-center">
          <p className="text-sm text-gray-400">Telefon</p>
          <p className="text-white font-medium">
            {agent.phoneNumber || <span className="text-gray-500">Nicht zugewiesen</span>}
          </p>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-400">Anrufe heute</p>
          <p className="text-white font-semibold">{agent.callsToday || 0}</p>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-400">Erfolgsrate</p>
          <p className="text-white font-semibold">
            {agent.successRate === undefined ? '-' : `${agent.successRate}%`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onTest}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-sm px-3 py-1.5"
          >
            <Play size={16} />
            Testen
          </Button>
          
          {isToggleable ? (
            <Button
              variant={agent.status === 'active' ? 'primary' : 'outline'}
              onClick={onToggleStatus}
              className="text-sm px-3 py-1.5"
            >
              {agent.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
              {agent.status === 'active' ? 'Pausieren' : 'Aktivieren'}
            </Button>
          ) : null}
          
          <Link
            to={`/dashboard/agents/${agent.id}/edit`}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Settings size={18} className="text-gray-400" />
          </Link>
        </div>
      </div>
    </div>
  </Link>
);

const GridViewCard: React.FC<CardViewProps> = ({ agent, onTest, onToggleStatus, isToggleable }) => (
  <Link
    to={`/dashboard/agents/${agent.id}`}
    className="block bg-surface border border-white/10 rounded-lg p-6 hover:border-accent/50 transition-all hover:shadow-lg hover:shadow-accent/10 group"
  >
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold text-white truncate mb-2">{agent.name}</h3>
        <p className="text-sm text-gray-400">{agent.industry}</p>
      </div>
      <button
        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        onClick={(e) => e.stopPropagation()}
        aria-label="Weitere Optionen"
      >
        <MoreVertical size={18} className="text-gray-400" />
      </button>
    </div>

    <StatusBadge status={agent.status} isDefault={agent.isDefaultAgent} />

    <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
      <Phone size={16} />
      <span>{agent.phoneNumber || 'Keine Nummer zugewiesen'}</span>
    </div>

    <div className="mt-4 grid grid-cols-2 gap-4">
      <div>
        <p className="text-xs text-gray-400">Anrufe heute</p>
        <p className="text-lg font-semibold text-white">{agent.callsToday || 0}</p>
      </div>
      <div>
        <p className="text-xs text-gray-400">Erfolgsrate</p>
        <p className="text-lg font-semibold text-white">
          {agent.successRate === undefined ? '-' : `${agent.successRate}%`}
        </p>
      </div>
    </div>

    <div className="mt-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button
        variant="outline"
        onClick={onTest}
        className="flex-1 text-sm px-3 py-1.5"
      >
        <Play size={16} />
        Testen
      </Button>
      
      {isToggleable ? (
        <Button
          variant={agent.status === 'active' ? 'primary' : 'outline'}
          onClick={onToggleStatus}
          className="flex-1 text-sm px-3 py-1.5"
        >
          {agent.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
          {agent.status === 'active' ? 'Pausieren' : 'Aktivieren'}
        </Button>
      ) : null}
      
      <Link
        to={`/dashboard/agents/${agent.id}/edit`}
        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <Settings size={18} className="text-gray-400" />
      </Link>
    </div>
  </Link>
);
