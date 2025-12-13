import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle both hash tokens (#access_token=...) and code flow (?code=...)
        // Supabase automatically handles hash tokens via getSession()
        // For code flow, we need to exchange the code
        
        // Check for code parameter (PKCE flow)
        const code = searchParams.get('code');
        if (code) {
          const { data, error: codeError } = await supabase.auth.exchangeCodeForSession(code);
          if (codeError) throw codeError;
          
          if (data.session) {
            // Clear URL fragment and navigate
            window.history.replaceState(null, '', '/auth/callback');
            navigate('/dashboard', { replace: true });
            return;
          }
        }

        // Try to get session (handles hash tokens automatically)
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        
        if (data.session) {
          // Successfully authenticated - clear URL fragment and redirect to dashboard
          // Remove any hash tokens (#access_token=...) from URL
          window.history.replaceState(null, '', '/auth/callback');
          navigate('/dashboard', { replace: true });
        } else {
          // No session - redirect to login
          setError('No session found. Please try logging in again.');
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 2000);
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setError(error instanceof Error ? error.message : 'Authentication failed');
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2000);
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

  // Clear URL fragment on mount (in case hash tokens are present)
  useEffect(() => {
    if (window.location.hash && (window.location.hash.includes('access_token') || window.location.hash.includes('code'))) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-white">
      {error ? (
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <p className="text-gray-400 text-sm">Redirecting to login...</p>
        </div>
      ) : (
        <LoadingSpinner />
      )}
    </div>
  );
};

