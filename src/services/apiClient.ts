import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
  AxiosError,
} from 'axios';
import { API_BASE_URL } from './apiBase.js';
import { supabase } from '../lib/supabase.js';

// Default timeout raised to handle slower agent provisioning calls.
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Safely extracts a string message from various error formats
 */
const extractMessage = (val: unknown): string => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && val !== null) {
    const obj = val as Record<string, unknown>;
    return String(obj.message || obj.error || JSON.stringify(obj));
  }
  return String(val);
};

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
      config.headers.Authorization = 'Bearer dev-bypass-token';
      return config;
    }

    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
      if (import.meta.env.DEV) {
        const { logger } = await import('../lib/logger.js');
        logger.warn('No access token available for request', { url: config.url });
      }
    }
  } catch (error) {
    const { logger } = await import('../lib/logger.js');
    logger.error('Error getting access token', error);
    delete config.headers.Authorization;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { 
      _retry?: boolean;
      _retryCount?: number;
    };
    const status = error.response?.status;
    const maxRetries = 2;
    const retryCount = originalRequest._retryCount || 0;

    // Handle 401 - refresh token
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
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
        await supabase.auth.signOut();
      }
    }

    // Handle 502/503 - retry with exponential backoff
    // Only retry if not already retried (check _retry flag properly)
    if ((status === 502 || status === 503) && retryCount < maxRetries) {
      // Check if this request was already retried by checking the _retry flag
      // But allow retries up to maxRetries
      originalRequest._retryCount = retryCount + 1;
      
      // Exponential backoff: 1s, 2s
      const delay = Math.pow(2, retryCount) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return apiClient(originalRequest);
    }

    let errorMessage = 'Ein unerwarteter Fehler ist aufgetreten.';

    if (!error.response) {
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        errorMessage = 'Die Verbindung zum Server wurde unterbrochen (Zeitüberschreitung).';
      } else if (
        error.message.includes('Network Error') ||
        error.message.includes('ERR_CONNECTION_REFUSED')
      ) {
        errorMessage = 'Server nicht erreichbar. Bitte überprüfe deine Internetverbindung.';
      } else {
        errorMessage = 'Netzwerkfehler. Bitte versuche es später erneut.';
      }
    } else {
      const data = error.response.data as Record<string, unknown>;
      const serverMsg = extractMessage(data?.message) || extractMessage(data?.error);

      switch (status) {
        case 400:
          errorMessage = serverMsg || 'Ungültige Anfrage.';
          break;
        case 403:
          errorMessage = 'Zugriff verweigert.';
          break;
        case 404:
          errorMessage = 'Ressource nicht gefunden.';
          break;
        case 429:
          errorMessage = 'Zu viele Anfragen. Bitte warte einen Moment.';
          break;
        case 500:
          errorMessage = serverMsg || 'Interner Serverfehler.';
          break;
        case 502:
          errorMessage = 'Der Server ist vorübergehend nicht erreichbar. Bitte versuche es in einem Moment erneut.';
          break;
        case 503:
          errorMessage = 'Der Service ist vorübergehend nicht verfügbar. Bitte versuche es in einem Moment erneut.';
          break;
        default:
          errorMessage = serverMsg || errorMessage;
      }
    }

    // Always attach userFriendlyMessage to the error object
    (error as Record<string, any>).userFriendlyMessage = errorMessage;
    (error as Record<string, any>).status = status;
    
    // Override the error message with user-friendly message
    if (error instanceof Error) {
      error.message = errorMessage;
    }

    if (error.response?.data && typeof error.response.data === 'object') {
      const apiError = error.response.data as Record<string, unknown>;
      const finalMsg = extractMessage(apiError.message) || extractMessage(apiError.error);

      if (finalMsg) {
        const enhancedError = new Error(errorMessage); // Use userFriendlyMessage as the main message
        Object.assign(enhancedError, {
          response: error.response,
          config: error.config,
          isAxiosError: true,
          userFriendlyMessage: errorMessage,
          status: status,
          originalMessage: finalMsg, // Keep original for debugging
        });
        return Promise.reject(enhancedError);
      }
    }

    return Promise.reject(error);
  },
);

export { apiClient };
