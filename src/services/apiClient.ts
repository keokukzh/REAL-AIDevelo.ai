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
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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

