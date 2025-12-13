import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const AuthCallbackPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (data.session) {
          // Successfully authenticated - redirect to dashboard
          navigate('/dashboard', { replace: true });
        } else {
          // No session - redirect to onboarding
          navigate('/onboarding', { replace: true });
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/onboarding', { replace: true });
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-white">
      <LoadingSpinner />
    </div>
  );
};

