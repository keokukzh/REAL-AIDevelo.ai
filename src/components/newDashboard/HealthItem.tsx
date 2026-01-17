import React from 'react';
import { Info } from 'lucide-react';

interface HealthItemProps {
  label: string;
  status: 'ok' | 'error' | 'warning';
  detail?: string;
  onFix?: () => void;
}

export const HealthItem: React.FC<HealthItemProps> = ({ label, status, detail, onFix }) => {
  const statusColors = {
    ok: 'bg-emerald-500',
    error: 'bg-red-500',
    warning: 'bg-amber-500',
  };

  const statusText = {
    ok: 'OK',
    error: 'ERROR',
    warning: 'WARN',
  };

  const statusTextColor = {
    ok: 'text-emerald-400',
    error: 'text-red-400',
    warning: 'text-amber-400',
  };

  return (
    <div
      className="flex flex-col gap-1"
      role="status"
      aria-label={`${label}: ${statusText[status]}`}
    >
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-gray-300">
          <div
            className={`w-1.5 h-1.5 rounded-full ${statusColors[status]}`}
            aria-hidden="true"
          ></div>
          <span>{label}</span>
          {detail && (
            <div className="group relative ml-1 p-0.5 text-gray-500 hover:text-gray-300 cursor-help">
              <Info size={12} />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-gray-300 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                {detail}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-mono font-medium ${statusTextColor[status]}`}
            aria-label={`Status: ${statusText[status]}`}
          >
            {statusText[status]}
          </span>
          {status !== 'ok' && onFix && (
            <button
              onClick={onFix}
              className="text-[10px] uppercase font-bold text-accent hover:underline decoration-accent/50 underline-offset-2"
            >
              FIX
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
