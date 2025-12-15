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
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <button 
      onClick={onClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      className="w-full flex items-center justify-between p-2 rounded hover:bg-slate-800/50 text-sm text-gray-300 group transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-slate-900"
      aria-label={label}
      aria-disabled={disabled || undefined}
    >
      <div className="flex items-center gap-3">
        <Icon 
          className="w-4 h-4 text-gray-500 group-hover:text-accent transition-colors" 
          aria-hidden="true"
        />
        <span>{label}</span>
      </div>
      <ArrowUpRight 
        className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100 transition-all" 
        aria-hidden="true"
      />
    </button>
  );
};
