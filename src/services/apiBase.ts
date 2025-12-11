// Shared API base URL resolver for both fetch/axios clients.
export const getApiBaseUrl = (): string => {
  // @ts-ignore - Vite environment variable
  if (import.meta.env?.VITE_API_URL) {
    // @ts-ignore
    return import.meta.env.VITE_API_URL;
  }

  // Check if we're in production (deployed on Cloudflare Pages)
  // @ts-ignore
  if (import.meta.env?.MODE === 'production' || window.location.hostname !== 'localhost') {
    // Production: use Railway backend
    return 'https://real-aideveloai-production.up.railway.app/api';
  }

  // Development: use localhost
  return 'http://localhost:5000/api';
};

export const API_BASE_URL = getApiBaseUrl();

