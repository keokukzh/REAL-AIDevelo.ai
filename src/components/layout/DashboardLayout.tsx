import React from 'react';
import { SideNav } from '../dashboard/SideNav.js';
import { LoadingSpinner } from '../ui/LoadingSpinner.js';

interface DashboardLayoutProps {
  children: React.ReactNode;
  isLoading?: boolean;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, isLoading }) => {
  const [isSideNavOpen, setIsSideNavOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-gray-950 flex font-sans text-white relative">
      {/* Background Effects - Grid Pattern */}
      <div
        className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_90%)] -z-40 pointer-events-none"
        aria-hidden="true"
      />

      {/* Side Navigation */}
      <SideNav isOpen={isSideNavOpen} onClose={() => setIsSideNavOpen(false)} />

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 flex flex-col min-w-0 min-h-screen relative">
        {/* Mobile Header Toggle */}
        <div className="lg:hidden h-16 flex items-center px-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-40">
          <button
            onClick={() => setIsSideNavOpen(true)}
            className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors"
            aria-label="Menü öffnen"
          >
            <div className="w-6 h-5 flex flex-col justify-between">
              <span className="w-full h-0.5 bg-current rounded-full" />
              <span className="w-full h-0.5 bg-current rounded-full" />
              <span className="w-full h-0.5 bg-current rounded-full" />
            </div>
          </button>
          <div className="ml-4 font-bold text-white tracking-tight">AIDevelo Studio</div>
        </div>
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <LoadingSpinner size="lg" message="Dashboard wird geladen..." />
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
};
