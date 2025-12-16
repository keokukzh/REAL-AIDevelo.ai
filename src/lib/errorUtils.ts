/**
 * Utility functions for error handling
 */

interface ApiError {
  response?: {
    data?: {
      error?: string;
      message?: string;
    };
  };
  message?: string;
}

/**
 * Extracts a user-friendly error message from various error formats
 * @param error - The error object (can be Axios error, Error, string, or unknown)
 * @param defaultMessage - Default message if error cannot be extracted
 * @returns A string error message
 */
export function extractErrorMessage(error: unknown, defaultMessage = 'Unbekannter Fehler'): string {
  if (!error) {
    return defaultMessage;
  }

  // Handle Axios/API errors
  if (error && typeof error === 'object' && 'response' in error) {
    const apiError = error as ApiError;
    const errorData = apiError.response?.data;
    
    if (errorData) {
      if (typeof errorData.error === 'string') {
        return errorData.error;
      }
      if (typeof errorData.message === 'string') {
        return errorData.message;
      }
      if (typeof errorData === 'string') {
        return errorData;
      }
      if (errorData.error && typeof errorData.error === 'object') {
        // If error is an object, try to extract message
        const nestedError = errorData.error as { message?: string; error?: string };
        return nestedError.message || nestedError.error || JSON.stringify(errorData.error);
      }
    }
    
    if (apiError.message) {
      return apiError.message;
    }
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return error.message;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  return defaultMessage;
}
