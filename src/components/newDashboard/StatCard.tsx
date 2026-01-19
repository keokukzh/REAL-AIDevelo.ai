import React from 'react';
import { ArrowUpRight, ArrowDownRight, LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  description?: string;
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  trend,
  trendUp,
  description,
  icon: Icon,
  iconColor,
  bgColor,
}) => {
  return (
    <div
      className="ultra-glass p-6 rounded-xl border border-slate-700/50 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300 group"
      role="article"
      aria-label={`${label}: ${value}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div
          className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center border border-slate-700/30 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
        >
          <Icon className={`w-6 h-6 ${iconColor}`} aria-hidden="true" />
        </div>
        {trend && (
          <div
            className={`flex items-center text-xs font-bold px-2.5 py-1 rounded-full border ${trendUp ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-swiss-red/10 text-red-400 border-red-500/20'}`}
          >
            {trendUp ? (
              <ArrowUpRight className="w-3 h-3 mr-1" aria-hidden="true" />
            ) : (
              <ArrowDownRight className="w-3 h-3 mr-1" aria-hidden="true" />
            )}
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-gray-400 text-[10px] uppercase font-bold tracking-[0.1em] mb-1 opacity-70">
          {label}
        </p>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold font-display text-white group-hover:text-accent transition-colors duration-300">
            {value}
          </p>
        </div>
        {description && (
          <p className="text-[10px] text-gray-500 mt-2 font-medium flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
            {description}
          </p>
        )}
      </div>
    </div>
  );
};
