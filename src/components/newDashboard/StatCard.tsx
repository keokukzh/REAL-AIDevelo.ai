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
    <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-700/50 backdrop-blur-sm hover:border-slate-600/50 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center border border-slate-700/30`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        {trend && (
          <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${trendUp ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
            {trendUp ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
            {trend}
          </div>
        )}
      </div>
      <div>
        <p className="text-gray-400 text-xs uppercase font-semibold tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
      </div>
    </div>
  );
};
