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
      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/50 text-sm text-gray-300 group transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
      aria-label={label}
      aria-disabled={disabled || undefined}
    >
      <div className="flex items-center gap-3">
        <Icon 
          className="w-4 h-4 text-gray-500 group-hover:text-accent transition-colors duration-200" 
          aria-hidden="true"
        />
        <span>{label}</span>
      </div>
      <ArrowUpRight 
        className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200" 
        aria-hidden="true"
      />
    </button>
  );
};
