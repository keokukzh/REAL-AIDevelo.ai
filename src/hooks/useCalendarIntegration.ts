import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient.js';
import { toast } from '../components/ui/Toast.js';
import { extractErrorMessage, extractUserFriendlyError } from '../lib/errorUtils.js';
import { logger } from '../lib/logger.js';

/**
 * Configuration for allowed postMessage origins
 * Should be moved to environment variables in production
 */
const getAllowedOrigins = (): string[] => {
  const frontendUrl = import.meta.env.VITE_FRONTEND_URL || globalThis.location.origin;
  const allowedOrigins = [
    frontendUrl,
    'https://aidevelo.ai',
    'https://www.aidevelo.ai',
    'https://real-aidevelo-ai.onrender.com',
    globalThis.location.origin,
  ];

  // Remove duplicates and filter out empty strings
  return Array.from(new Set(allowedOrigins.filter(Boolean)));
};

/**
 * Strict origin validation - only exact matches allowed
 */
const isAllowedOrigin = (origin: string): boolean => {
  const allowed = getAllowedOrigins();
  return allowed.includes(origin);
};

/**
 * Custom hook for calendar OAuth integration
 * Handles postMessage events and OAuth flow
 */
export const useCalendarIntegration = (
  onCalendarConnected?: () => void,
  onCalendarError?: (error: string) => void,
) => {
  const queryClient = useQueryClient();
  const authWindowRef = useRef<Window | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messageListenerRef = useRef<((event: MessageEvent) => void) | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (messageListenerRef.current) {
      window.removeEventListener('message', messageListenerRef.current);
      messageListenerRef.current = null;
    }
    if (authWindowRef.current && !authWindowRef.current.closed) {
      authWindowRef.current.close();
      authWindowRef.current = null;
    }
  }, []);

  // Handle postMessage events for calendar OAuth
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Strict origin validation - security critical
      if (!isAllowedOrigin(event.origin)) {
        logger.warn('Rejected postMessage from unauthorized origin', {
          origin: event.origin,
          allowedOrigins: getAllowedOrigins(),
        });
        return;
      }

      if (event.data?.type === 'calendar-oauth-success') {
        logger.info('Calendar OAuth success received');
        toast.success('Kalender erfolgreich verbunden');
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] });
        onCalendarConnected?.();
      } else if (event.data?.type === 'calendar-oauth-error') {
        const errorMsg =
          typeof event.data.message === 'string'
            ? event.data.message
            : 'Fehler beim Verbinden des Kalenders';
        logger.error('Calendar OAuth error', new Error(errorMsg));
        toast.error(errorMsg);
        onCalendarError?.(errorMsg);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [queryClient, onCalendarConnected, onCalendarError]);

  // Handle calendar connection
  const connectCalendar = useCallback(async () => {
    try {
      const response = await apiClient.get<{ success: boolean; data: { authUrl: string } }>(
        '/calendar/google/auth',
      );

      if (!response.data?.success || !response.data.data?.authUrl) {
        throw new Error('Keine Auth-URL erhalten');
      }

      const authUrl = response.data.data.authUrl;

      // Check if this is a mock URL (for testing without OAuth configured)
      const isMockUrl = authUrl.includes('/calendar/') && authUrl.includes('code=mock_code');

      if (isMockUrl) {
        toast.warning(
          'OAuth ist noch nicht konfiguriert. Bitte setze GOOGLE_OAUTH_CLIENT_ID in Render Environment Variables.',
        );
        return;
      }

      // Open OAuth window
      const width = 600;
      const height = 700;
      const left = globalThis.screen.width / 2 - width / 2;
      const top = globalThis.screen.height / 2 - height / 2;
      const authWindow = globalThis.open(
        authUrl,
        'Calendar OAuth',
        `width=${width},height=${height},left=${left},top=${top}`,
      );

      if (!authWindow) {
        toast.error('Pop-up wurde blockiert. Bitte erlaube Pop-ups für diese Seite.');
        return;
      }

      authWindowRef.current = authWindow;

      // Clean up any existing listener before adding a new one
      if (messageListenerRef.current) {
        window.removeEventListener('message', messageListenerRef.current);
      }

      // Listen for OAuth callback postMessage
      const messageListener = (event: MessageEvent) => {
        // Strict origin validation
        if (!isAllowedOrigin(event.origin)) {
          logger.warn('Rejected postMessage from unauthorized origin in OAuth flow', {
            origin: event.origin,
          });
          return;
        }

        if (event.data?.type === 'calendar-oauth-success') {
          logger.info('Calendar OAuth success via postMessage');
          toast.success('Kalender erfolgreich verbunden');
          queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] });
          cleanup();
          onCalendarConnected?.();
        } else if (event.data?.type === 'calendar-oauth-error') {
          const errorMsg =
            typeof event.data.message === 'string'
              ? event.data.message
              : 'Fehler beim Verbinden des Kalenders';
          logger.error('Calendar OAuth error via postMessage', new Error(errorMsg));
          toast.error(errorMsg);
          cleanup();
          onCalendarError?.(errorMsg);
        }
      };

      messageListenerRef.current = messageListener;
      window.addEventListener('message', messageListener);

      // Fallback: Poll for calendar connection if postMessage doesn't work
      let pollCount = 0;
      const maxPolls = 30; // 30 seconds
      pollIntervalRef.current = setInterval(() => {
        pollCount++;

        // Check if window was closed
        if (authWindow?.closed) {
          cleanup();

          // If window closed and we haven't received success, check if calendar is connected
          if (pollCount < maxPolls) {
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] });
              // Trigger refetch via callback if provided
              onCalendarConnected?.();
            }, 2000);
          }
          return;
        }

        // Stop polling after max attempts
        if (pollCount >= maxPolls) {
          cleanup();
        }
      }, 1000);
    } catch (error: unknown) {
      logger.error('Calendar connection error', error);
      const errorMsg = extractErrorMessage(error, 'Fehler beim Verbinden des Kalenders');
      toast.error(`Fehler beim Verbinden des Kalenders: ${errorMsg}`);
      onCalendarError?.(errorMsg);
    }
  }, [queryClient, cleanup, onCalendarConnected, onCalendarError]);

  // Handle calendar disconnect
  const disconnectCalendar = useCallback(async () => {
    try {
      const response = await apiClient.delete('/calendar/google/disconnect');
      if (response.data?.success) {
        toast.success('Kalender erfolgreich getrennt');
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] });
      } else {
        throw new Error('Disconnect fehlgeschlagen');
      }
    } catch (error: unknown) {
      const userFriendlyError = extractUserFriendlyError(
        error,
        'Fehler beim Trennen des Kalenders',
      );
      logger.error('Calendar disconnect error', error);
      toast.error(`${userFriendlyError.title}: ${userFriendlyError.message}`);
    }
  }, [queryClient]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    connectCalendar,
    disconnectCalendar,
  };
};
