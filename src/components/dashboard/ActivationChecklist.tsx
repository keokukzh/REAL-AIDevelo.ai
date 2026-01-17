import React from 'react';
import { CheckCircle, Circle, ArrowRight } from 'lucide-react';

export interface SelectionItem {
  id: string;
  label: string;
  done: boolean;
  action?: () => void;
  actionLabel?: string;
}

interface ActivationChecklistProps {
  items: SelectionItem[];
  title?: string;
  className?: string;
}

export const ActivationChecklist: React.FC<ActivationChecklistProps> = ({
  items,
  title = 'Aktivierungs-Checkliste',
  className = '',
}) => {
  const completed = items.filter((i) => i.done).length;
  const percent = Math.round((completed / items.length) * 100);

  return (
    <div
      className={`bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 shadow-xl relative overflow-hidden ${className}`}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

      <div className="relative z-10 flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-1">{title}</p>
          <h3 className="text-xl font-bold font-display text-white">
            {completed} / {items.length} abgeschlossen
          </h3>
        </div>
        <div className="text-right">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                className="text-slate-800"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 20}`}
                strokeDashoffset={`${2 * Math.PI * 20 * (1 - percent / 100)}`}
                className="text-accent transition-all duration-1000 ease-out"
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-[10px] font-bold text-white">{percent}%</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 ${
              item.done
                ? 'bg-emerald-500/5 border-emerald-500/20'
                : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-500/50'
            }`}
          >
            <div className="flex-shrink-0">
              {item.done ? (
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <CheckCircle size={14} className="text-black" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-slate-600 flex items-center justify-center">
                  <Circle size={10} className="text-slate-600 opacity-0" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <span
                className={`text-sm font-medium transition-colors ${item.done ? 'text-emerald-400' : 'text-gray-300'}`}
              >
                {item.label}
              </span>
            </div>

            {!item.done && item.action && (
              <button
                onClick={item.action}
                className="text-xs text-accent hover:text-accent/80 font-semibold flex items-center gap-1 transition-all group"
              >
                {item.actionLabel || 'Einrichten'}
                <ArrowRight
                  size={12}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </button>
            )}
          </div>
        ))}
      </div>

      {percent === 100 && (
        <div className="mt-6 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
          <p className="text-xs font-semibold text-emerald-400">🚀 Bereit für den Live-Betrieb!</p>
        </div>
      )}
    </div>
  );
};
