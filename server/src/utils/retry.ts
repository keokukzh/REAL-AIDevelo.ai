import { RETRY_CONFIG } from '../config/constants';

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryable?: (error: Error) => boolean;
}

/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param options Retry configuration
 * @returns Result of the function
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = RETRY_CONFIG.MAX_ATTEMPTS,
    initialDelayMs = RETRY_CONFIG.INITIAL_DELAY_MS,
    maxDelayMs = RETRY_CONFIG.MAX_DELAY_MS,
    backoffMultiplier = RETRY_CONFIG.BACKOFF_MULTIPLIER,
    retryable = () => true, // By default, retry all errors
  } = options;

  let lastError: Error | unknown;
  let delay = initialDelayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      if (error instanceof Error && !retryable(error)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxAttempts) {
        break;
      }

      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * backoffMultiplier, maxDelayMs);
    }
  }

  // If we get here, all retries failed
  throw lastError;
}

/**
 * Check if an error is retryable (transient failure)
 */
export function isRetryableError(error: Error): boolean {
  // Network errors
  if (
    error.message.includes('ECONNRESET') ||
    error.message.includes('ETIMEDOUT') ||
    error.message.includes('ENOTFOUND') ||
    error.message.includes('network') ||
    error.message.includes('timeout')
  ) {
    return true;
  }

  // HTTP 5xx errors (server errors)
  if ((error as any).statusCode && (error as any).statusCode >= 500) {
    return true;
  }

  // Rate limiting (429) - retry with backoff
  if ((error as any).statusCode === 429) {
    return true;
  }

  // HTTP 408 (Request Timeout)
  if ((error as any).statusCode === 408) {
    return true;
  }

  return false;
}

/**
 * Retry with exponential backoff for external API calls
 */
export async function retryApiCall<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  return retryWithBackoff(fn, {
    ...options,
    retryable: options.retryable || isRetryableError,
  });
}
