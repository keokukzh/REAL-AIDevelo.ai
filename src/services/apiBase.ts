// Shared API base URL resolver for both fetch/axios clients.
export const getApiBaseUrl = (): string => {
  // @ts-ignore - Vite environment variable
  if (import.meta.env?.VITE_API_URL) {
    // @ts-ignore
    const apiUrl = import.meta.env.VITE_API_URL;
    // If VITE_API_URL is set to "/api" or relative path, make it absolute
    if (apiUrl.startsWith('/')) {
      return window.location.origin + apiUrl;
    }
    // If it's already absolute (e.g., full URL), use it as-is
    // WARNING: In production, absolute URLs bypass Pages Function proxy and may trigger CSP/CORB
    // (No console log - production should be silent)
    return apiUrl;
  }

  // Check if we're in production (deployed on Cloudflare Pages)
  // @ts-ignore
  if (import.meta.env?.MODE === 'production' || window.location.hostname !== 'localhost') {
    // Production: use same-origin /api (proxied by Cloudflare Pages Function to Render backend)
    // This satisfies CSP connect-src 'self' requirement
    const baseUrl = window.location.origin + '/api';
    // (No console log - production should be silent)
    return baseUrl;
  }

  // Development: use localhost
  return 'http://localhost:5000/api';
};

export const API_BASE_URL = getApiBaseUrl();

