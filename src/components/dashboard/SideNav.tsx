import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, PhoneCall, Settings, BookOpen, BarChart3 } from 'lucide-react';
import { NavItem } from '../newDashboard/NavItem';
import { useDashboardOverview } from '../../hooks/useDashboardOverview';
import { useAuthContext } from '../../contexts/AuthContext';

export const SideNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthContext();
  const { data: overview } = useDashboardOverview();

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    if (path === '/knowledge-base') {
      return location.pathname === '/knowledge-base';
    }
    if (path === '/analytics') {
      return location.pathname === '/analytics';
    }
    return location.pathname.startsWith(path);
  };

  const getInitials = (name: string | null | undefined): string => {
    if (!name) return 'U';
    // Split on spaces and filter out empty strings (handles consecutive spaces)
    const parts = name.split(' ').filter(part => part.length > 0);
    if (parts.length >= 2) {
      // Both parts are guaranteed to be non-empty after filtering
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    // Fallback: use first 2 characters of the name (or first character if name is too short)
    return name.substring(0, 2).toUpperCase() || name.substring(0, 1).toUpperCase() || 'U';
  };

  const organizationName = overview?.organization?.name || 'AIDevelo';
  const userEmail = user?.email || overview?.user?.email || '';
  const initials = getInitials(organizationName);

  return (
    <aside 
      className="w-64 bg-slate-900 text-white flex flex-col fixed inset-y-0 left-0 z-50 border-r border-slate-800/50"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="h-16 flex items-center justify-center px-6 border-b border-slate-800">
        <img 
          src="/logo-studio-white.png" 
          alt="AIDevelo Studio" 
          className="h-10 w-auto object-contain"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      </div>
      
      <div className="p-4 space-y-1 flex-1 overflow-y-auto">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3 mt-2">
          Operations
        </div>
        <NavItem 
          icon={LayoutDashboard} 
          label="Übersicht" 
          active={isActive('/dashboard')} 
          onClick={() => navigate('/dashboard')} 
        />
        <NavItem 
          icon={PhoneCall} 
          label="Anrufprotokoll" 
          active={isActive('/calls')} 
          onClick={() => navigate('/calls')} 
        />
        <NavItem 
          icon={Calendar} 
          label="Kalender" 
          active={isActive('/dashboard/calendar')} 
          onClick={() => navigate('/dashboard/calendar')} 
        />
        <NavItem 
          icon={BarChart3} 
          label="Analytics" 
          active={isActive('/analytics')} 
          onClick={() => navigate('/analytics')} 
        />
        <NavItem 
          icon={BookOpen} 
          label="Knowledge Base" 
          active={isActive('/knowledge-base')} 
          onClick={() => navigate('/knowledge-base')} 
        />
        
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3 mt-6">
          Konfiguration
        </div>
        <NavItem 
          icon={Settings} 
          label="Einstellungen" 
          active={isActive('/dashboard/settings')} 
          onClick={() => navigate('/dashboard/settings')} 
        />
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-swiss-red to-orange-500 flex items-center justify-center text-xs font-bold text-white shadow-lg ring-2 ring-slate-800">
            {initials}
          </div>
          <div className="flex-1 overflow-hidden min-w-0">
            <p className="font-medium text-sm truncate text-white">{organizationName}</p>
            <p className="text-xs text-gray-400 truncate">{userEmail || 'Benutzer'}</p>
          </div>
          <Settings 
            className="w-4 h-4 text-gray-500 hover:text-white cursor-pointer transition-colors flex-shrink-0" 
            onClick={() => navigate('/dashboard/settings')}
          />
        </div>
      </div>
    </aside>
  );
};
