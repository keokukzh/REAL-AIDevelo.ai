import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  Plus,
  Copy,
  Check,
  ExternalLink,
  Settings,
  RefreshCw,
  ChevronDown,
  Globe,
  Loader2,
} from 'lucide-react';
import { toast } from '../ui/Toast.js';

interface QuickPhoneAssignmentProps {
  currentNumber: string | null;
  webhookConfigured: boolean;
  isLoading?: boolean;
  onConfigurePhone: () => void;
  onCopyNumber?: () => void;
  onRefreshStatus?: () => void;
  compact?: boolean;
}

export const QuickPhoneAssignment: React.FC<QuickPhoneAssignmentProps> = ({
  currentNumber,
  webhookConfigured,
  isLoading = false,
  onConfigurePhone,
  onCopyNumber,
  onRefreshStatus,
  compact = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleCopy = async () => {
    if (!currentNumber) return;

    try {
      await navigator.clipboard.writeText(currentNumber);
      setCopied(true);
      toast.success('Nummer kopiert!');
      onCopyNumber?.();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Kopieren fehlgeschlagen');
    }
  };

  const formatPhoneNumber = (number: string) => {
    // Format for Swiss numbers: +41 44 123 45 67
    if (number.startsWith('+41')) {
      return number.replace(/(\+41)(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
    }
    // Format for German numbers: +49 30 123 456 78
    if (number.startsWith('+49')) {
      return number.replace(/(\+49)(\d{2,3})(\d{3})(\d{3})(\d{2})/, '$1 $2 $3 $4 $5');
    }
    return number;
  };

  // Compact view for inline usage
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {currentNumber ? (
          <>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-800/50 border border-slate-700/50">
              <Phone className="w-3 h-3 text-emerald-400" />
              <span className="text-xs font-mono text-white">
                {formatPhoneNumber(currentNumber)}
              </span>
              {webhookConfigured && (
                <div
                  className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                  title="Webhook konfiguriert"
                />
              )}
            </div>
            <button
              onClick={handleCopy}
              className="p-1 rounded hover:bg-slate-700/50 text-gray-400 hover:text-white transition-colors"
              title="Nummer kopieren"
            >
              {copied ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </>
        ) : (
          <button
            onClick={onConfigurePhone}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-accent/10 border border-accent/20 text-accent text-xs font-medium hover:bg-accent/20 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Nummer hinzufügen
          </button>
        )}
      </div>
    );
  }

  // Full view for dashboard
  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/80 transition-colors"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center gap-3">
          <div
            className={`
            w-10 h-10 rounded-lg flex items-center justify-center
            ${
              currentNumber
                ? 'bg-emerald-500/20 border border-emerald-500/30'
                : 'bg-slate-700/50 border border-slate-600/50'
            }
          `}
          >
            <Phone className={`w-5 h-5 ${currentNumber ? 'text-emerald-400' : 'text-gray-400'}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-white">
              {currentNumber ? 'Telefonnummer' : 'Keine Nummer zugewiesen'}
            </p>
            {currentNumber ? (
              <p className="text-lg font-mono font-semibold text-white tracking-wide">
                {formatPhoneNumber(currentNumber)}
              </p>
            ) : (
              <p className="text-xs text-gray-400">Klicke um eine Nummer zu verbinden</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isLoading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
          {currentNumber && webhookConfigured && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-emerald-400">Live</span>
            </div>
          )}
          {currentNumber && !webhookConfigured && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500/20 border border-amber-500/30">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-xs font-medium text-amber-400">Webhook fehlt</span>
            </div>
          )}
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform ${showDetails ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Expandable Details */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 space-y-3 border-t border-slate-700/50">
              {currentNumber ? (
                <>
                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-2 pt-3">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-sm text-gray-300 hover:text-white transition-colors border border-slate-600/50"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      Kopieren
                    </button>
                    <button
                      onClick={onConfigurePhone}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-sm text-gray-300 hover:text-white transition-colors border border-slate-600/50"
                    >
                      <Settings className="w-4 h-4" />
                      Einstellungen
                    </button>
                    {onRefreshStatus && (
                      <button
                        onClick={onRefreshStatus}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-sm text-gray-300 hover:text-white transition-colors border border-slate-600/50"
                        disabled={isLoading}
                      >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Status prüfen
                      </button>
                    )}
                  </div>

                  {/* Status Info */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/50">
                      <Globe className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-gray-400">Land:</span>
                      <span className="text-white font-medium">
                        {currentNumber.startsWith('+41')
                          ? '🇨🇭 Schweiz'
                          : currentNumber.startsWith('+49')
                            ? '🇩🇪 Deutschland'
                            : currentNumber.startsWith('+43')
                              ? '🇦🇹 Österreich'
                              : 'Unbekannt'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/50">
                      <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-gray-400">Provider:</span>
                      <span className="text-white font-medium">Twilio</span>
                    </div>
                  </div>
                </>
              ) : (
                /* No number - Show CTA */
                <div className="pt-3">
                  <button
                    onClick={onConfigurePhone}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent font-medium transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Telefonnummer verbinden
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Weiterleitung oder neue Nummer kaufen
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuickPhoneAssignment;
