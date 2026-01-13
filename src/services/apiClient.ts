import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
  AxiosError,
} from 'axios';
import { API_BASE_URL } from './apiBase';
import { supabase } from '../lib/supabase';

// Default timeout raised to handle slower agent provisioning calls.
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Get Supabase access token
const getAccessToken = async (): Promise<string | null> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
};

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  try {
    // Dev bypass: Don't require token if dev bypass is enabled
    const devBypassEnabled = import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';

    if (devBypassEnabled) {
      // In dev bypass mode, backend will use dev bypass auth middleware
      // We can send a dummy token or no token at all
      config.headers.Authorization = 'Bearer dev-bypass-token';
      return config;
    }

    const token = await getAccessToken();
    // Only set Authorization header if token exists (prevents 401 race conditions)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // Remove Authorization header if no token (prevents sending stale/invalid tokens)
      delete config.headers.Authorization;
      // Log warning in dev mode only
      if (import.meta.env.DEV) {
        const { logger } = await import('../lib/logger');
        logger.warn('No access token available for request', { url: config.url });
      }
    }
  } catch (error) {
    // If getAccessToken fails, log but don't crash
    const { logger } = await import('../lib/logger');
    logger.error('Error getting access token', error);
    delete config.headers.Authorization;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;

    // Handle 401: Try to refresh Supabase session
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Supabase automatically refreshes tokens, but we need to get the new session
      const {
        data: { session },
      } = await supabase.auth.refreshSession();

      if (session?.access_token) {
        originalRequest.headers = {
          ...(originalRequest.headers || {}),
          Authorization: `Bearer ${session.access_token}`,
        };
        return apiClient(originalRequest);
      } else {
        // Session expired or invalid - redirect to login
        await supabase.auth.signOut();
      }
    }

    // Centralized Network & API Error Handling
    let errorMessage = 'Ein unerwarteter Fehler ist aufgetreten.';

    if (!error.response) {
      // Network error (no response received)
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        errorMessage =
          'Die Verbindung zum Server wurde unterbrochen (Zeitüberschreitung). Bitte versuche es erneut.';
      } else if (
        error.message.includes('Network Error') ||
        error.message.includes('ERR_CONNECTION_REFUSED')
      ) {
        errorMessage = 'Server nicht erreichbar. Bitte überprüfe deine Internetverbindung.';
      } else {
        errorMessage = 'Netzwerkfehler. Bitte versuche es später erneut.';
      }
    } else {
      // Server responded with an error status
      const data = error.response.data as any;

      switch (status) {
        case 400:
          errorMessage = data.message || data.error || 'Ungültige Anfrage.';
          break;
        case 403:
          errorMessage = 'Zugriff verweigert. Du hast nicht die erforderlichen Berechtigungen.';
          break;
        case 404:
          errorMessage = 'Die angeforderte Ressource wurde nicht gefunden.';
          break;
        case 429:
          errorMessage =
            'Zu viele Anfragen. Bitte warte einen Moment, bevor du es erneut versuchst.';
          break;
        case 500:
          errorMessage = 'Interner Serverfehler. Unser Team wurde benachrichtigt.';
          break;
        default:
          errorMessage = data.message || data.error || errorMessage;
      }
    }

    // Attach user-friendly message to error object
    (error as any).userFriendlyMessage = errorMessage;

    // Enhance error message with API response data if available
    if (error.response?.data && typeof error.response.data === 'object') {
      const apiError = error.response.data as any;
      if (apiError.error || apiError.message) {
        const enhancedError = new Error(apiError.message || apiError.error);
        (enhancedError as any).response = error.response;
        (enhancedError as any).config = error.config;
        (enhancedError as any).isAxiosError = true;
        (enhancedError as any).userFriendlyMessage = errorMessage;
        return Promise.reject(enhancedError);
      }
    }

    return Promise.reject(error);
  },
);

export { apiClient };
