import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Power, Pause, Play, Loader2, AlertTriangle } from 'lucide-react';

export type AgentState = 'ready' | 'paused' | 'inactive' | 'needs_setup';

interface AgentActivationToggleProps {
  currentState: AgentState;
  isLoading: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  onPause: () => void;
  onResume: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showInlineConfirm?: boolean;
}

const stateConfig = {
  ready: {
    label: 'Aktiv',
    color: 'emerald',
    bgClass: 'bg-emerald-500',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/30',
    glowClass: 'shadow-emerald-500/20',
    icon: Power,
  },
  paused: {
    label: 'Pausiert',
    color: 'amber',
    bgClass: 'bg-amber-500',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/30',
    glowClass: 'shadow-amber-500/20',
    icon: Pause,
  },
  inactive: {
    label: 'Inaktiv',
    color: 'gray',
    bgClass: 'bg-gray-500',
    textClass: 'text-gray-400',
    borderClass: 'border-gray-500/30',
    glowClass: 'shadow-gray-500/20',
    icon: Power,
  },
  needs_setup: {
    label: 'Setup',
    color: 'blue',
    bgClass: 'bg-blue-500',
    textClass: 'text-blue-400',
    borderClass: 'border-blue-500/30',
    glowClass: 'shadow-blue-500/20',
    icon: AlertTriangle,
  },
};

const sizeConfig = {
  sm: { toggle: 'w-12 h-6', dot: 'w-4 h-4', translate: 'translate-x-6', text: 'text-xs' },
  md: { toggle: 'w-16 h-8', dot: 'w-6 h-6', translate: 'translate-x-8', text: 'text-sm' },
  lg: { toggle: 'w-20 h-10', dot: 'w-8 h-8', translate: 'translate-x-10', text: 'text-base' },
};

export const AgentActivationToggle: React.FC<AgentActivationToggleProps> = ({
  currentState,
  isLoading,
  onActivate,
  onDeactivate,
  onPause,
  onResume,
  disabled = false,
  size = 'md',
  showInlineConfirm = true,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<'deactivate' | 'pause' | null>(null);

  const config = stateConfig[currentState];
  const sizes = sizeConfig[size];
  const isActive = currentState === 'ready';
  const isPaused = currentState === 'paused';

  const handleToggleClick = () => {
    if (disabled || isLoading) return;

    if (isActive) {
      // Currently active - show options to pause or deactivate
      if (showInlineConfirm) {
        setPendingAction('pause');
        setShowConfirm(true);
      } else {
        onPause();
      }
    } else if (isPaused) {
      // Currently paused - resume
      onResume();
    } else {
      // Inactive or needs setup - activate
      onActivate();
    }
  };

  const handleConfirmAction = () => {
    if (pendingAction === 'pause') {
      onPause();
    } else if (pendingAction === 'deactivate') {
      onDeactivate();
    }
    setShowConfirm(false);
    setPendingAction(null);
  };

  const handleCancelAction = () => {
    setShowConfirm(false);
    setPendingAction(null);
  };

  const handleFullDeactivate = () => {
    setPendingAction('deactivate');
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Main Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleToggleClick}
          disabled={disabled || isLoading || showConfirm}
          className={`
            relative ${sizes.toggle} rounded-full transition-all duration-300 ease-in-out
            ${
              isActive
                ? 'bg-emerald-500/20 border-2 border-emerald-500/50'
                : isPaused
                  ? 'bg-amber-500/20 border-2 border-amber-500/50'
                  : 'bg-slate-700/50 border-2 border-slate-600/50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}
            focus:outline-none focus:ring-2 focus:ring-accent/50
          `}
          aria-label={isActive ? 'Agent deaktivieren' : 'Agent aktivieren'}
        >
          {/* Toggle dot */}
          <motion.div
            className={`
              absolute top-1 ${sizes.dot} rounded-full flex items-center justify-center
              shadow-lg ${config.glowClass}
              ${isActive ? config.bgClass : isPaused ? 'bg-amber-500' : 'bg-slate-500'}
            `}
            animate={{
              x: isActive ? parseInt(sizes.translate.replace('translate-x-', '')) * 4 : 4,
            }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 text-white animate-spin" />
            ) : isActive ? (
              <Power className="w-3 h-3 text-white" />
            ) : isPaused ? (
              <Play className="w-3 h-3 text-white" />
            ) : (
              <Power className="w-3 h-3 text-white" />
            )}
          </motion.div>

          {/* Pulse effect when active */}
          {isActive && !isLoading && (
            <motion.div
              className="absolute inset-0 rounded-full bg-emerald-500/20"
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </button>

        {/* Status label */}
        <div className="flex flex-col">
          <span className={`font-semibold ${sizes.text} ${config.textClass}`}>
            {isLoading ? 'Wird geändert...' : config.label}
          </span>
          {isActive && <span className="text-xs text-gray-500">Nimmt Anrufe an</span>}
          {isPaused && <span className="text-xs text-gray-500">Anrufe werden weitergeleitet</span>}
        </div>
      </div>

      {/* Inline Confirmation */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50">
              <p className="text-sm text-gray-300 mb-3">
                {pendingAction === 'deactivate'
                  ? 'Agent komplett deaktivieren?'
                  : 'Agent pausieren? (Einstellungen bleiben erhalten)'}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleConfirmAction}
                  className={`
                    flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                    ${
                      pendingAction === 'deactivate'
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                        : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30'
                    }
                  `}
                >
                  {pendingAction === 'deactivate' ? 'Deaktivieren' : 'Pausieren'}
                </button>
                {pendingAction === 'pause' && (
                  <button
                    onClick={handleFullDeactivate}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors"
                  >
                    Deaktivieren
                  </button>
                )}
                <button
                  onClick={handleCancelAction}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-700/50 text-gray-400 hover:bg-slate-700 border border-slate-600/50 transition-colors"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AgentActivationToggle;
