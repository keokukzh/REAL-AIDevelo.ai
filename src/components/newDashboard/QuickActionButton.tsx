import React from 'react';
import { ArrowUpRight, LucideIcon } from 'lucide-react';

interface QuickActionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}

export const QuickActionButton: React.FC<QuickActionButtonProps> = ({ 
  icon: Icon, 
  label, 
  onClick,
  disabled = false
}) => {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-between p-2 rounded hover:bg-slate-50 text-sm text-slate-600 group transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-slate-400 group-hover:text-swiss-red transition-colors" />
        <span>{label}</span>
      </div>
      <ArrowUpRight className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-all" />
    </button>
  );
};
