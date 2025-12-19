import React from 'react';
import { ArrowUpRight, ArrowDownRight, LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  label, 
  value, 
  trend, 
  trendUp, 
  icon: Icon, 
  iconColor, 
  bgColor 
}) => {
  return (
    <div 
      className="bg-surface/80 p-6 rounded-xl border border-slate-700/50 backdrop-blur-sm hover:border-accent/30 hover:shadow-lg hover:shadow-accent/10 transition-all duration-200 focus-within:ring-2 focus-within:ring-accent/50 focus-within:ring-offset-2 focus-within:ring-offset-background"
      role="article"
      aria-label={`${label}: ${value}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center border border-slate-700/30 shadow-sm transition-transform duration-200 group-hover:scale-110`}>
          <Icon className={`w-6 h-6 ${iconColor}`} aria-hidden="true" />
        </div>
        {trend && (
          <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full transition-colors duration-200 ${trendUp ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-swiss-red/20 text-red-400 border border-red-500/30'}`}>
            {trendUp ? <ArrowUpRight className="w-3 h-3 mr-1" aria-hidden="true" /> : <ArrowDownRight className="w-3 h-3 mr-1" aria-hidden="true" />}
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-gray-400 text-xs uppercase font-semibold tracking-wider mb-1">{label}</p>
        <p className="text-3xl font-bold font-display text-white">{value}</p>
      </div>
    </div>
  );
};
