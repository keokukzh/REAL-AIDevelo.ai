// Get API URL from environment or use default
const getApiBaseUrl = (): string => {
  // @ts-ignore - Vite environment variable
  if (import.meta.env?.VITE_API_URL) {
    // @ts-ignore
    return import.meta.env.VITE_API_URL;
  }
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
    console.log('[API] Making request to:', url);
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

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
    // Handle network errors
    if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
      throw new ApiRequestError(
        0,
        'Network error: Unable to connect to the server. Please check your connection and ensure the backend server is running on ' + API_BASE_URL.replace('/api', '')
      );
    }
    // Re-throw unknown errors
    throw error;
  }
}
