import React from 'react';
import { Phone, Calendar, Settings, BarChart3, Home } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../../config/navigation';

interface MobileBottomNavItem {
  icon: React.ElementType;
  label: string;
  route: string;
  badge?: number;
}

const navItems: MobileBottomNavItem[] = [
  { icon: Home, label: 'Dashboard', route: ROUTES.DASHBOARD },
  { icon: Phone, label: 'Anrufe', route: ROUTES.CALLS },
  { icon: Calendar, label: 'Kalender', route: ROUTES.CALENDAR },
  { icon: BarChart3, label: 'Analysen', route: ROUTES.ANALYTICS },
  { icon: Settings, label: 'Einstellungen', route: ROUTES.SETTINGS },
];

/**
 * Sticky bottom navigation for mobile devices
 * Provides quick access to main sections
 */
export const MobileBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (route: string) => {
    if (route === ROUTES.DASHBOARD) {
      return location.pathname === ROUTES.DASHBOARD;
    }
    return location.pathname.startsWith(route);
  };

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.route);

          return (
            <button
              key={item.route}
              onClick={() => navigate(item.route)}
              className={`
                flex flex-col items-center justify-center gap-1
                min-w-[44px] min-h-[44px] px-3 py-2 rounded-lg
                transition-all duration-200
                touch-manipulation
                ${active
                  ? 'text-accent bg-accent/10'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-slate-800/50'}
                active:scale-95
              `}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span className="text-[10px] font-medium">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
