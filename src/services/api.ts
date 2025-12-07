export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

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
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiRequestError(
        0,
        'Network error: Unable to connect to the server. Please check your connection.'
      );
    }
    throw error;
  }
}
