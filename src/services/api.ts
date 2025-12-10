// Get API URL from environment or use default
const getApiBaseUrl = (): string => {
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

export interface ApiError {
  success: false;
  error: string;
  details?: unknown;
}

export class ApiRequestError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    // Only log in development and for debugging
    if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_API === 'true') {
      console.log('[API] Making request to:', url);
    }
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    
    clearTimeout(timeoutId);

    // Check content type before parsing JSON
    const contentType = response.headers.get('content-type');
    let data: unknown;

    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (jsonError) {
        // If JSON parsing fails, create a generic error
        throw new ApiRequestError(
          response.status,
          `Invalid JSON response: ${response.statusText}`,
          { status: response.status, statusText: response.statusText }
        );
      }
    } else {
      // Non-JSON response
      const text = await response.text();
      data = { error: text || response.statusText };
    }

    if (!response.ok) {
      const errorData = data as ApiError;
      throw new ApiRequestError(
        response.status,
        errorData.error || `API Error: ${response.statusText}`,
        errorData.details
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }
    
    // Handle abort (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiRequestError(
        0,
        'Request timeout: Der Server antwortet nicht. Bitte versuchen Sie es später erneut.',
        { timeout: true }
      );
    }
    
    // Handle network errors
    if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
      // Check if it's a CORS error
      const isCorsError = error.message.includes('CORS') || error.message.includes('Access-Control');
      const errorMsg = isCorsError
        ? 'CORS-Fehler: Der Server erlaubt keine Anfragen von dieser Domain. Bitte kontaktieren Sie den Support.'
        : `Netzwerkfehler: Verbindung zum Server fehlgeschlagen. Bitte überprüfen Sie Ihre Internetverbindung und stellen Sie sicher, dass der Server läuft: ${API_BASE_URL.replace('/api', '')}`;
      
      throw new ApiRequestError(
        0,
        errorMsg,
        { networkError: true, url: API_BASE_URL }
      );
    }
    
    // Re-throw unknown errors
    throw error;
  }
}
