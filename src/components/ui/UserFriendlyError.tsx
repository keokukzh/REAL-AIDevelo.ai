import React from 'react';
import { AlertCircle, RefreshCw, HelpCircle, ExternalLink } from 'lucide-react';
import { Button } from './Button.js';
import { UserFriendlyError as UserFriendlyErrorType } from '../../lib/errorUtils.js';

interface UserFriendlyErrorProps {
  error: UserFriendlyErrorType;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  showSupportLink?: boolean;
}

export const UserFriendlyError: React.FC<UserFriendlyErrorProps> = ({
  error,
  onRetry,
  onDismiss,
  className = '',
  showSupportLink = true,
}) => {
  return (
    <div
      className={`bg-red-500/10 border border-red-500/30 rounded-xl p-6 ${className}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-400" aria-hidden="true" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white mb-2">{error.title}</h3>
          <p className="text-gray-300 mb-3">{error.message}</p>

          {error.solution && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-blue-400 mb-1">Lösungsvorschlag:</p>
                  <p className="text-sm text-gray-300">{error.solution}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {error.retryable && onRetry && (
              <Button
                variant="primary"
                size="sm"
                onClick={onRetry}
                className="flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Erneut versuchen
              </Button>
            )}

            {error.action && error.actionLabel && (
              <Button
                variant="outline"
                size="sm"
                onClick={error.action}
                className="flex items-center gap-2"
              >
                {error.actionLabel}
              </Button>
            )}

            {showSupportLink && (
              <a
                href="mailto:support@aidevelo.ai?subject=Support-Anfrage"
                className="text-sm text-gray-400 hover:text-gray-300 flex items-center gap-1 transition-colors"
              >
                Support kontaktieren
                <ExternalLink size={14} />
              </a>
            )}

            {onDismiss && (
              <Button variant="ghost" size="sm" onClick={onDismiss}>
                Schließen
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface InlineErrorProps {
  error: UserFriendlyErrorType;
  onRetry?: () => void;
  compact?: boolean;
}

export const InlineError: React.FC<InlineErrorProps> = ({ error, onRetry, compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-red-400 text-sm" role="alert">
        <AlertCircle size={16} aria-hidden="true" />
        <span>{error.message}</span>
        {error.retryable && onRetry && (
          <button
            onClick={onRetry}
            className="text-red-300 hover:text-red-200 underline text-xs"
            aria-label="Erneut versuchen"
          >
            Erneut versuchen
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4" role="alert">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-400 mb-1">{error.title}</p>
          <p className="text-sm text-gray-300 mb-2">{error.message}</p>
          {error.solution && (
            <p className="text-xs text-gray-400 mb-3">{error.solution}</p>
          )}
          {error.retryable && onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
              <RefreshCw size={14} className="mr-2" />
              Erneut versuchen
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
