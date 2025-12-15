import React from 'react';
import { LucideIcon } from 'lucide-react';

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, active = false, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200 group ${
        active 
          ? 'bg-swiss-red text-white font-medium shadow-md shadow-red-900/20' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
      {label}
    </button>
  );
};
