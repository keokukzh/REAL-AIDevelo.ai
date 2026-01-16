import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  PhoneCall,
  Settings,
  BookOpen,
  BarChart3,
  HelpCircle,
  MessageSquare,
  CreditCard,
} from 'lucide-react';
import { NavItem } from '../newDashboard/NavItem.js';
import { useDashboardOverview } from '../../hooks/useDashboardOverview.js';
import { useAuthContext } from '../../contexts/AuthContext.js';
import { SupportContactModal } from './SupportContactModal.js';
import { CrossSectionNav } from '../navigation/CrossSectionNav.js';
import { ROUTES } from '../../config/navigation.js';

export const SideNav: React.FC<{ isOpen?: boolean; onClose?: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthContext();
  const { data: overview } = useDashboardOverview();
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === ROUTES.DASHBOARD) {
      return location.pathname === ROUTES.DASHBOARD;
    }
    if (path === ROUTES.KNOWLEDGE_BASE) {
      return location.pathname === ROUTES.KNOWLEDGE_BASE;
    }
    if (path === ROUTES.ANALYTICS) {
      return location.pathname === ROUTES.ANALYTICS;
    }
    if (path === ROUTES.CHANNELS) {
      return location.pathname === ROUTES.CHANNELS;
    }
    return location.pathname.startsWith(path);
  };

  const getInitials = (name: string | null | undefined): string => {
    if (!name) return 'U';
    // Split on spaces and filter out empty strings (handles consecutive spaces)
    const parts = name.split(' ').filter((part) => part.length > 0);
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
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
          onClick={onClose}
        />
      )}

      <nav
        className={`w-64 bg-slate-900 text-white flex flex-col fixed inset-y-0 left-0 z-50 border-r border-slate-800/50 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Main navigation"
      >
        <div className="h-16 flex items-center justify-center px-6 border-b border-slate-800">
          <button
            onClick={() => {
              navigate(ROUTES.DASHBOARD);
              onClose?.();
            }}
            className="focus:outline-none focus:ring-2 focus:ring-swiss-red focus:ring-offset-2 focus:ring-offset-slate-900 rounded-md p-2 transition-all duration-200 hover:scale-105 hover:shadow-glow-red cursor-pointer"
            aria-label="Navigate to dashboard"
          >
            <img
              src="/logo-studio-white.png"
              alt="AIDevelo Studio"
              className="h-10 w-auto object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </button>
        </div>

        <div className="p-4 space-y-1 flex-1 overflow-y-auto">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3 mt-2">
            Operations
          </div>
          <NavItem
            icon={LayoutDashboard}
            label="Übersicht"
            active={isActive(ROUTES.DASHBOARD)}
            onClick={() => {
              navigate(ROUTES.DASHBOARD);
              onClose?.();
            }}
          />
          <NavItem
            icon={PhoneCall}
            label="Anrufprotokoll"
            active={isActive(ROUTES.CALLS)}
            onClick={() => {
              navigate(ROUTES.CALLS);
              onClose?.();
            }}
          />
          <NavItem
            icon={Calendar}
            label="Kalender"
            active={isActive(ROUTES.CALENDAR)}
            onClick={() => {
              navigate(ROUTES.CALENDAR);
              onClose?.();
            }}
          />
          <NavItem
            icon={BarChart3}
            label="Analytics"
            active={isActive(ROUTES.ANALYTICS)}
            onClick={() => {
              navigate(ROUTES.ANALYTICS);
              onClose?.();
            }}
          />
          <NavItem
            icon={BookOpen}
            label="Knowledge Base"
            active={isActive(ROUTES.KNOWLEDGE_BASE)}
            onClick={() => {
              navigate(ROUTES.KNOWLEDGE_BASE);
              onClose?.();
            }}
          />

          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3 mt-6">
            Konfiguration
          </div>
          <NavItem
            icon={MessageSquare}
            label="Kanäle"
            active={isActive(ROUTES.CHANNELS)}
            onClick={() => {
              navigate(ROUTES.CHANNELS);
              onClose?.();
            }}
          />
          <NavItem
            icon={CreditCard}
            label="Abonnement"
            active={isActive(ROUTES.SUBSCRIPTION)}
            onClick={() => {
              navigate(ROUTES.SUBSCRIPTION);
              onClose?.();
            }}
          />
          <NavItem
            icon={Settings}
            label="Einstellungen"
            active={isActive(ROUTES.SETTINGS)}
            onClick={() => {
              navigate(ROUTES.SETTINGS);
              onClose?.();
            }}
          />
          {(overview?.user?.role === 'admin' || user?.user_metadata?.role === 'admin') && (
            <NavItem
              icon={BarChart3}
              label="Admin Insights"
              active={location.pathname === '/admin/dashboard'}
              onClick={() => {
                navigate('/admin/dashboard');
                onClose?.();
              }}
            />
          )}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50 space-y-3">
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
              onClick={() => {
                navigate(ROUTES.SETTINGS);
                onClose?.();
              }}
              aria-label="Einstellungen"
            />
          </div>
          <CrossSectionNav variant="sidebar" />
          <button
            onClick={() => {
              setIsSupportModalOpen(true);
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-slate-800/70 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-slate-900"
            aria-label="Support kontaktieren"
          >
            <HelpCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span className="truncate">Support</span>
          </button>
        </div>

        <SupportContactModal
          isOpen={isSupportModalOpen}
          onClose={() => setIsSupportModalOpen(false)}
        />
      </nav>
    </>
  );
};
