import React from 'react';
import { motion } from 'framer-motion';
import {
  Mic,
  Globe,
  Phone,
  MessageSquare,
  Settings,
  BarChart3,
  Zap,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { AgentActivationToggle, AgentState } from './AgentActivationToggle.js';
import { QuickPhoneAssignment } from './QuickPhoneAssignment.js';

interface AgentConfig {
  id: string;
  setup_state: AgentState;
  persona_gender?: string | null;
  persona_age_range?: string | null;
  business_type?: string | null;
  updated_at?: string;
}

interface PhoneStatus {
  twilioGateway: 'OK' | 'WARN' | 'ERROR';
  twilioConfigured: boolean;
  hasConnectedNumber: boolean;
  webhookConfigured: boolean;
  phoneNumber: string | null;
}

interface VoiceAgentControlCenterProps {
  agentConfig: AgentConfig;
  phoneStatus: PhoneStatus | null;
  isActivating?: boolean;
  isDeactivating?: boolean;
  isPausing?: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  onPause: () => void;
  onResume: () => void;
  onTestCall: () => void;
  onConfigurePhone: () => void;
  onSettings: () => void;
  onViewLogs?: () => void;
  className?: string;
}

export const VoiceAgentControlCenter: React.FC<VoiceAgentControlCenterProps> = ({
  agentConfig,
  phoneStatus,
  isActivating = false,
  isDeactivating = false,
  isPausing = false,
  onActivate,
  onDeactivate,
  onPause,
  onResume,
  onTestCall,
  onConfigurePhone,
  onSettings,
  onViewLogs,
  className = '',
}) => {
  const isActive = agentConfig.setup_state === 'ready';
  const isPaused = agentConfig.setup_state === 'paused';
  const isLoading = isActivating || isDeactivating || isPausing;

  // Determine status label for visual indicators
  const statusLabel = isActive ? 'Live & Bereit' : isPaused ? 'Pausiert' : 'Nicht aktiv';

  // Last activity time
  const lastActivity = agentConfig.updated_at
    ? new Date(agentConfig.updated_at).toLocaleString('de-CH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <motion.div
      className={`
        relative overflow-hidden rounded-2xl 
        bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-800/95
        backdrop-blur-xl border border-slate-700/50 shadow-2xl
        ${className}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className={`
          absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-20
          ${isActive ? 'bg-emerald-500' : isPaused ? 'bg-amber-500' : 'bg-slate-500'}
          transition-colors duration-1000
        `}
        />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full blur-2xl bg-accent/10" />

        {/* Animated grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <div className="relative z-10 p-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-6">
          {/* Agent Info */}
          <div className="flex items-start gap-4">
            {/* Avatar with status indicator */}
            <div className="relative">
              <div
                className={`
                w-16 h-16 rounded-2xl flex items-center justify-center
                bg-gradient-to-br from-slate-800 to-slate-900
                border-2 ${isActive ? 'border-emerald-500/50' : isPaused ? 'border-amber-500/50' : 'border-slate-600/50'}
                shadow-lg transition-colors duration-500
              `}
              >
                <Mic
                  className={`w-8 h-8 ${isActive ? 'text-emerald-400' : isPaused ? 'text-amber-400' : 'text-gray-400'}`}
                />
              </div>

              {/* Status dot with pulse */}
              <div className="absolute -bottom-1 -right-1">
                <div
                  className={`
                  w-5 h-5 rounded-full border-2 border-slate-900 flex items-center justify-center
                  ${isActive ? 'bg-emerald-500' : isPaused ? 'bg-amber-500' : 'bg-gray-500'}
                  shadow-lg
                `}
                >
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-emerald-500"
                      animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold font-display text-white truncate">
                  AIDevelo Receptionist
                </h2>
                <span
                  className={`
                  px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                  ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : isPaused
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-700/50 text-gray-400 border border-slate-600/50'
                  }
                `}
                >
                  {statusLabel}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Schweizerdeutsch</span>
                </div>
                {agentConfig.business_type && (
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    <span>{agentConfig.business_type}</span>
                  </div>
                )}
                {lastActivity && (
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs">Aktualisiert: {lastActivity}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Activation Toggle */}
          <div className="flex-shrink-0">
            <AgentActivationToggle
              currentState={agentConfig.setup_state}
              isLoading={isLoading}
              onActivate={onActivate}
              onDeactivate={onDeactivate}
              onPause={onPause}
              onResume={onResume}
              size="lg"
              showInlineConfirm={true}
            />
          </div>
        </div>

        {/* Phone Assignment Section */}
        <div className="mb-6">
          <QuickPhoneAssignment
            currentNumber={phoneStatus?.phoneNumber || null}
            webhookConfigured={phoneStatus?.webhookConfigured || false}
            isLoading={false}
            onConfigurePhone={onConfigurePhone}
          />
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickActionCard
            icon={Phone}
            label="Testanruf"
            description="Agent live testen"
            onClick={onTestCall}
            variant="primary"
            disabled={!isActive && !isPaused}
          />
          <QuickActionCard
            icon={MessageSquare}
            label="Chat Test"
            description="Text-Konversation"
            onClick={onTestCall}
            disabled={!isActive && !isPaused}
          />
          <QuickActionCard
            icon={Settings}
            label="Einstellungen"
            description="Agent konfigurieren"
            onClick={onSettings}
          />
          <QuickActionCard
            icon={BarChart3}
            label="Statistiken"
            description="Anrufverlauf"
            onClick={onViewLogs || (() => {})}
          />
        </div>

        {/* Status Bar */}
        {isActive && (
          <motion.div
            className="mt-6 flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-emerald-500/10 border border-emerald-500/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-medium text-emerald-400">
              Agent ist aktiv und nimmt Anrufe entgegen
            </span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// Internal Quick Action Card component
interface QuickActionCardProps {
  icon: React.ElementType;
  label: string;
  description: string;
  onClick: () => void;
  variant?: 'default' | 'primary';
  disabled?: boolean;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({
  icon: Icon,
  label,
  description,
  onClick,
  variant = 'default',
  disabled = false,
}) => {
  const isPrimary = variant === 'primary';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        group relative p-4 rounded-xl text-left transition-all duration-200
        ${
          isPrimary
            ? 'bg-accent/10 border-2 border-accent/30 hover:bg-accent/20 hover:border-accent/50'
            : 'bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 hover:border-slate-600/50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        focus:outline-none focus:ring-2 focus:ring-accent/50
      `}
    >
      <div className="flex items-start justify-between">
        <div
          className={`
          w-10 h-10 rounded-lg flex items-center justify-center mb-2
          ${isPrimary ? 'bg-accent/20' : 'bg-slate-700/50'}
        `}
        >
          <Icon
            className={`w-5 h-5 ${isPrimary ? 'text-accent' : 'text-gray-400 group-hover:text-white'}`}
          />
        </div>
        <ArrowRight
          className={`
          w-4 h-4 text-gray-600 group-hover:text-gray-400 
          transform group-hover:translate-x-0.5 transition-all
          ${disabled ? 'hidden' : ''}
        `}
        />
      </div>
      <p className={`font-semibold text-sm ${isPrimary ? 'text-accent' : 'text-white'}`}>{label}</p>
      <p className="text-xs text-gray-500 mt-0.5">{description}</p>
    </button>
  );
};

export default VoiceAgentControlCenter;
