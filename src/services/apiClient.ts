import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from './apiBase';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const getAccessToken = () => localStorage.getItem('auth_token');
const getRefreshToken = () => localStorage.getItem('refresh_token');

const setAccessToken = (token: string) => localStorage.setItem('auth_token', token);

let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  if (!refreshPromise) {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    refreshPromise = axios
      .post(`${API_BASE_URL}/auth/refresh`, { refreshToken })
      .then((response) => {
        const newToken = response.data?.data?.token as string | undefined;
        if (newToken) setAccessToken(newToken);
        return newToken ?? null;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
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

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        originalRequest.headers = {
          ...(originalRequest.headers || {}),
          Authorization: `Bearer ${newToken}`,
        };
        return apiClient(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

export { apiClient };

