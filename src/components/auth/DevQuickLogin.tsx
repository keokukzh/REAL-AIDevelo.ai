import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';

/**
 * Dev Quick Login Component
 * Only shown when VITE_DEV_BYPASS_AUTH=true
 * Allows instant login to dashboard without OAuth
 */
export const DevQuickLogin: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();

  // Only show in development with dev bypass enabled
  if (import.meta.env.VITE_DEV_BYPASS_AUTH !== 'true') {
    return null;
  }

  // If already authenticated, don't show button
  if (isAuthenticated) {
    return null;
  }

  const handleQuickLogin = () => {
    // In dev bypass mode, we don't need a real Supabase session
    // The backend will use dev bypass auth middleware
    // Just navigate to dashboard - the API calls will work without token
    navigate('/dashboard');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={handleQuickLogin}
        className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg shadow-lg font-semibold text-sm"
        title="Dev Quick Login - Bypass OAuth (only in development)"
      >
        🚀 Dev Quick Login
      </button>
    </div>
  );
};
