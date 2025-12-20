// Shared API base URL resolver for both fetch/axios clients.
export const getApiBaseUrl = (): string => {
  const __canDebugLog =
    globalThis.window !== undefined &&
    (globalThis.window.location.hostname === 'localhost' || globalThis.window.location.hostname === '127.0.0.1');

  // @ts-ignore - Vite environment variable
  if (import.meta.env?.VITE_API_URL) {
    // @ts-ignore
    const apiUrl = import.meta.env.VITE_API_URL;
    // If VITE_API_URL is set to "/api" or relative path, make it absolute
    if (apiUrl.startsWith('/')) {
      // #region agent log
      if (__canDebugLog) {
        fetch('http://127.0.0.1:7242/ingest/30ee3678-5abc-4df4-b37b-e571a3b256e0', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: 'debug-session',
            runId: 'pre-fix',
            hypothesisId: 'H4',
            location: 'src/services/apiBase.ts:VITE_API_URL_relative',
            message: 'Resolved API base URL from VITE_API_URL (relative)',
            data: { apiUrl, resolved: globalThis.window.location.origin + apiUrl },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
      }
      // #endregion
      return globalThis.window.location.origin + apiUrl;
    }
    // If it's already absolute (e.g., full URL), use it as-is
    // WARNING: In production, absolute URLs bypass Pages Function proxy and may trigger CSP/CORB
    // (No console log - production should be silent)
    // #region agent log
    if (__canDebugLog) {
      fetch('http://127.0.0.1:7242/ingest/30ee3678-5abc-4df4-b37b-e571a3b256e0', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'pre-fix',
          hypothesisId: 'H4',
          location: 'src/services/apiBase.ts:VITE_API_URL_absolute',
          message: 'Resolved API base URL from VITE_API_URL (absolute)',
          data: { apiUrl },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    }
    // #endregion
    return apiUrl;
  }

  // Check if we're in production (deployed on Cloudflare Pages)
  // @ts-ignore
  if (import.meta.env?.MODE === 'production' || globalThis.window.location.hostname !== 'localhost') {
    // Production: use same-origin /api (proxied by Cloudflare Pages Function to Render backend)
    // This satisfies CSP connect-src 'self' requirement
    const baseUrl = globalThis.window.location.origin + '/api';
    // (No console log - production should be silent)
    // #region agent log
    if (__canDebugLog) {
      fetch('http://127.0.0.1:7242/ingest/30ee3678-5abc-4df4-b37b-e571a3b256e0', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'pre-fix',
          hypothesisId: 'H4',
          location: 'src/services/apiBase.ts:defaultProd',
          message: 'Resolved API base URL default production',
          data: { resolved: baseUrl, hostname: globalThis.window.location.hostname, mode: (import.meta as any).env?.MODE },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    }
    // #endregion
    return baseUrl;
  }

  // Development: use localhost
  // #region agent log
  if (__canDebugLog) {
    fetch('http://127.0.0.1:7242/ingest/30ee3678-5abc-4df4-b37b-e571a3b256e0', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'pre-fix',
        hypothesisId: 'H4',
        location: 'src/services/apiBase.ts:defaultDev',
        message: 'Resolved API base URL default development',
        data: { resolved: 'http://localhost:5000/api', hostname: globalThis.window.location.hostname, mode: (import.meta as any).env?.MODE },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }
  // #endregion
  return 'http://localhost:5000/api';
};

export const API_BASE_URL = getApiBaseUrl();

