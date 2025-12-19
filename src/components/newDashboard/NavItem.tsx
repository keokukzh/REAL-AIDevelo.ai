import React from 'react';
import { LucideIcon } from 'lucide-react';

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, active = false, onClick }) => {
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
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
        active 
          ? 'bg-swiss-red text-white font-semibold shadow-md shadow-red-900/30 hover:bg-red-700' 
          : 'text-gray-400 hover:bg-slate-800/70 hover:text-white'
      }`}
      aria-current={active ? 'page' : undefined}
      aria-label={label}
    >
      <Icon 
        className={`w-4 h-4 flex-shrink-0 transition-colors duration-200 ${active ? 'text-white' : 'text-gray-500 group-hover:text-white'}`}
        aria-hidden="true"
      />
      <span className="truncate">{label}</span>
    </button>
  );
};
