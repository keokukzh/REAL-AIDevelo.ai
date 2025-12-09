import React, { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export const CalendarCallbackPage = () => {
  const { provider } = useParams<{ provider: 'google' | 'outlook' }>();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // This page is only shown if OAuth callback fails to close window
    // The actual callback is handled by the backend route which returns HTML
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (code && state && provider) {
      // Post message to opener if exists
      if (window.opener) {
        window.opener.postMessage({
          type: 'calendar-oauth-success',
          provider,
        }, window.location.origin);
        window.close();
      } else {
        // Redirect to onboarding if no opener
        window.location.href = '/onboarding';
      }
    } else {
      // Redirect on error
      window.location.href = '/onboarding?error=calendar_connection_failed';
    }
  }, [provider, searchParams]);

  return (
    <div className="min-h-screen bg-background text-white flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="animate-spin text-accent mx-auto mb-4" size={32} />
        <p className="text-gray-400">Kalender wird verbunden...</p>
      </div>
    </div>
  );
};

