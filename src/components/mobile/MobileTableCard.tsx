import React from 'react';
import { MoreHorizontal, Phone, Clock, CheckCircle, XCircle, Voicemail } from 'lucide-react';
import { StatusBadge } from '../newDashboard/StatusBadge';

interface MobileTableCardProps {
  id: string;
  caller: string;
  duration: string;
  status: string;
  timestamp: string;
  onClick?: () => void;
}

/**
 * Mobile-optimized table row as a card
 * Replaces table rows on mobile devices for better touch interaction
 */
export const MobileTableCard: React.FC<MobileTableCardProps> = ({
  caller,
  duration,
  status,
  timestamp,
  onClick,
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'missed':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'voicemail':
        return <Voicemail className="w-5 h-5 text-yellow-400" />;
      default:
        return <Phone className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div
      onClick={onClick}
      className={`
        bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4
        transition-all duration-200
        ${onClick ? 'cursor-pointer active:scale-[0.98] active:bg-slate-800/80' : ''}
        touch-manipulation
      `}
      role={onClick ? 'button' : 'article'}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
      aria-label={`Anruf von ${caller}, ${status}, ${duration}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Status Icon */}
          <div className="flex-shrink-0 mt-0.5">{getStatusIcon()}</div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={status} />
              <span className="text-xs text-gray-500 font-mono">{timestamp}</span>
            </div>
            <p className="font-semibold text-white text-base mb-1 truncate">{caller}</p>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock className="w-4 h-4" aria-hidden="true" />
              <span className="font-mono">{duration}</span>
            </div>
          </div>
        </div>

        {/* Action Indicator */}
        {onClick && (
          <div className="flex-shrink-0">
            <MoreHorizontal className="w-5 h-5 text-gray-500" aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Container for mobile table cards with proper spacing
 */
export const MobileTableCardList: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div className={`space-y-3 ${className}`} role="list">
      {children}
    </div>
  );
};
