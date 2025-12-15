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
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const organizationName = overview?.organization?.name || 'AIDevelo';
  const userEmail = user?.email || overview?.user?.email || '';
  const initials = getInitials(organizationName);

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col fixed inset-y-0 left-0 z-50">
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
        <div className="bg-swiss-red w-7 h-7 rounded-md flex items-center justify-center text-white font-bold text-sm">
          +
        </div>
        <span className="font-bold text-lg tracking-tight">AIDevelo.ai</span>
      </div>
      
      <div className="p-4 space-y-1 flex-1 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3 mt-2">
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
        
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3 mt-6">
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
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-swiss-red to-orange-500 flex items-center justify-center text-xs font-bold text-white shadow-lg">
            {initials}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="font-medium text-sm truncate">{organizationName}</p>
            <p className="text-xs text-slate-400 truncate">{userEmail || 'Benutzer'}</p>
          </div>
          <Settings 
            className="w-4 h-4 text-slate-500 hover:text-white cursor-pointer transition-colors" 
            onClick={() => navigate('/dashboard/settings')}
          />
        </div>
      </div>
    </aside>
  );
};
