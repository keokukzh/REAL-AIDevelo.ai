import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Phone, Calendar, PhoneCall, Settings, BookOpen } from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'Telefon', path: '/dashboard/phone', icon: <Phone size={20} /> },
  { label: 'Kalender', path: '/dashboard/calendar', icon: <Calendar size={20} /> },
  { label: 'Calls/Logs', path: '/calls', icon: <PhoneCall size={20} /> },
  { label: 'Knowledge Base', path: '/knowledge-base', icon: <BookOpen size={20} /> },
  { label: 'Einstellungen', path: '/dashboard/settings', icon: <Settings size={20} /> },
];

export const SideNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    if (path === '/knowledge-base') {
      return location.pathname === '/knowledge-base';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="w-64 bg-surface border-r border-white/10 min-h-screen p-4">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white">AIDevelo</h2>
        <p className="text-xs text-gray-400 mt-1">Operations Dashboard</p>
      </div>

      <ul className="space-y-2">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <li key={item.path}>
              <button
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  active
                    ? 'bg-accent text-black font-medium'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
