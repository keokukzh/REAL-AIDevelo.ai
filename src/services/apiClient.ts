import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig, AxiosError } from 'axios';
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
  const { data: { session } } = await supabase.auth.getSession();
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
      const { data: { session } } = await supabase.auth.refreshSession();
      
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

    return Promise.reject(error);
  }
);

export { apiClient };

