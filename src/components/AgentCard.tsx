import React from 'react';
import { motion } from 'framer-motion';
import { Phone, Settings, Play, RefreshCw, Activity, CheckCircle, Clock, XCircle, MoreVertical, Globe } from 'lucide-react';
import { Button } from './ui/Button';

interface Agent {
  id: string;
  elevenLabsAgentId?: string;
  businessProfile: {
    companyName: string;
    industry?: string;
  };
  config: {
    primaryLocale: string;
  };
  subscription?: {
    planId: string;
    planName: string;
  };
  telephony?: {
    phoneNumber?: string;
    phoneNumberId?: string;
    status: 'unassigned' | 'assigned' | 'active' | 'inactive';
  };
  status: 'draft' | 'configuring' | 'production_ready' | 'inactive' | 'pending_activation' | 'active' | 'live';
  lastTestResult?: {
    score: number;
    passed: boolean;
    timestamp: string;
  };
  // Optional metrics
  metrics?: {
    callsToday?: number;
    successRate?: number;
    avgDuration?: number;
  };
}

interface AgentCardProps {
  agent: Agent;
  onEdit?: (agent: Agent) => void;
  onTest?: (agentId?: string) => void;
  onSync?: (agentId: string) => void;
  onDiagnostics?: (agentId: string) => void;
  onActivate?: (agentId: string) => void;
  onClick?: (agent: Agent) => void;
  activating?: boolean;
  syncing?: boolean;
}

const getStatusBadge = (status: Agent['status']) => {
  const badges = {
    live: { icon: CheckCircle, color: 'bg-green-500/20 text-green-400', text: 'LIVE', border: 'border-green-500/30' },
    active: { icon: CheckCircle, color: 'bg-green-500/20 text-green-400', text: 'AKTIV', border: 'border-green-500/30' },
    pending_activation: { icon: Clock, color: 'bg-yellow-500/20 text-yellow-400', text: 'WARTEND', border: 'border-yellow-500/30' },
    inactive: { icon: XCircle, color: 'bg-gray-500/20 text-gray-400', text: 'INAKTIV', border: 'border-gray-500/30' },
    draft: { icon: Clock, color: 'bg-yellow-500/20 text-yellow-400', text: 'ENTWURF', border: 'border-yellow-500/30' },
    configuring: { icon: Clock, color: 'bg-yellow-500/20 text-yellow-400', text: 'KONFIGURIEREN', border: 'border-yellow-500/30' },
    production_ready: { icon: CheckCircle, color: 'bg-blue-500/20 text-blue-400', text: 'BEREIT', border: 'border-blue-500/30' },
  };
  return badges[status] || badges.inactive;
};

const getLanguageLabel = (locale: string): string => {
  const labels: Record<string, string> = {
    'de-CH': 'DE',
    'fr-CH': 'FR',
    'it-CH': 'IT',
    'en-US': 'EN',
    'en-GB': 'EN',
  };
  return labels[locale] || locale;
};

export const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  onEdit,
  onTest,
  onSync,
  onDiagnostics,
  onActivate,
  onClick,
  activating = false,
  syncing = false,
}) => {
  const statusBadge = getStatusBadge(agent.status);
  const Icon = statusBadge.icon;
  const isActive = agent.status === 'active' || agent.status === 'live';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-surface rounded-2xl border border-white/10 overflow-hidden hover:border-accent/50 transition-all duration-300 group cursor-pointer"
      onClick={() => onClick?.(agent)}
    >
      {/* Header */}
      <div className="p-6 border-b border-white/5">
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center text-accent">
            <Phone size={24} />
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 border ${statusBadge.color} ${statusBadge.border}`}>
            <Icon size={12} />
            {statusBadge.text}
          </div>
        </div>

        <h3 className="text-xl font-bold mb-1">{agent.businessProfile.companyName}</h3>
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 bg-white/5 rounded text-xs text-gray-300 flex items-center gap-1">
            <Globe size={12} />
            {getLanguageLabel(agent.config.primaryLocale)}
          </span>
          {agent.businessProfile.industry && (
            <span className="px-2 py-0.5 bg-white/5 rounded text-xs text-gray-300">
              {agent.businessProfile.industry}
            </span>
          )}
        </div>

        {agent.telephony?.phoneNumber && (
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-300">
            <Phone size={14} />
            <span>{agent.telephony.phoneNumber}</span>
            <span className={`px-1.5 py-0.5 rounded text-xs ${
              agent.telephony.status === 'active' 
                ? 'bg-green-500/20 text-green-400'
                : 'bg-gray-500/20 text-gray-400'
            }`}>
              {agent.telephony.status === 'active' ? 'Aktiv' : 'Zugewiesen'}
            </span>
          </div>
        )}

        {/* Mini Metrics */}
        {agent.metrics && (
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            {agent.metrics.callsToday !== undefined && (
              <div className="bg-white/5 rounded p-2 text-center">
                <div className="text-gray-400">Heute</div>
                <div className="font-bold text-white">{agent.metrics.callsToday}</div>
              </div>
            )}
            {agent.metrics.successRate !== undefined && (
              <div className="bg-white/5 rounded p-2 text-center">
                <div className="text-gray-400">Erfolg</div>
                <div className="font-bold text-white">{agent.metrics.successRate}%</div>
              </div>
            )}
            {agent.metrics.avgDuration !== undefined && (
              <div className="bg-white/5 rounded p-2 text-center">
                <div className="text-gray-400">Ø Dauer</div>
                <div className="font-bold text-white">{agent.metrics.avgDuration}s</div>
              </div>
            )}
          </div>
        )}

        {agent.lastTestResult && (
          <div className="mt-3 bg-white/5 p-2 rounded text-xs">
            <div className="flex justify-between mb-1">
              <span>Diagnose Score:</span>
              <span className={agent.lastTestResult.score > 90 ? 'text-green-400' : 'text-yellow-400'}>
                {agent.lastTestResult.score}%
              </span>
            </div>
            <div className="w-full bg-gray-700 h-1 rounded-full overflow-hidden">
              <div 
                className={`h-full ${agent.lastTestResult.score > 90 ? 'bg-green-500' : 'bg-yellow-500'} transition-all`} 
                style={{ width: `${agent.lastTestResult.score}%` }}
              />
            </div>
          </div>
        )}

        {agent.subscription && (
          <div className="mt-2 text-xs text-gray-500">
            Plan: {agent.subscription.planName}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 bg-black/20 flex flex-col gap-2">
        {(agent.status === 'inactive' || agent.status === 'pending_activation') && onActivate && (
          <Button 
            variant="primary" 
            onClick={(e) => {
              e.stopPropagation();
              onActivate(agent.id);
            }}
            disabled={activating}
            className="w-full text-xs h-10 !bg-accent hover:!bg-accent/80 font-semibold"
          >
            {activating ? 'Aktiviere...' : 'Agent aktivieren'}
          </Button>
        )}
        <div className="flex gap-2">
          {onSync && (
            <Button 
              variant="outline" 
              onClick={(e) => {
                e.stopPropagation();
                onSync(agent.id);
              }}
              disabled={syncing}
              className="flex-1 text-xs h-10"
            >
              <RefreshCw size={14} className={`mr-2 ${syncing ? 'animate-spin' : ''}`} />
              Sync
            </Button>
          )}
          {onDiagnostics && (
            <Button 
              variant="outline" 
              onClick={(e) => {
                e.stopPropagation();
                onDiagnostics(agent.id);
              }}
              className="flex-1 text-xs h-10"
            >
              <Activity size={14} className="mr-2" />
              Diagnose
            </Button>
          )}
          {onTest && (
            <Button 
              variant="primary" 
              onClick={(e) => {
                e.stopPropagation();
                onTest(agent.elevenLabsAgentId);
              }}
              className="flex-1 text-xs h-10 !bg-white !text-black hover:!bg-gray-200 font-semibold"
            >
              <Play size={14} className="mr-2" />
              Testen
            </Button>
          )}
          {onEdit && (
            <Button 
              variant="outline" 
              onClick={(e) => {
                e.stopPropagation();
                onEdit(agent);
              }}
              className="text-xs h-10 px-3"
            >
              <Settings size={14} />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};


