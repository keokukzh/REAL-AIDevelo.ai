import { describe, it, expect, vi, beforeEach } from 'vitest';
import { retryWithBackoff, retryApiCall, isRetryableError } from '../retry';

describe('retry utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('retryWithBackoff', () => {
    it('should succeed on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await retryWithBackoff(fn);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce('success');
      
      const result = await retryWithBackoff(fn, { maxAttempts: 3 });
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max attempts', async () => {
      const error = new Error('persistent error');
      const fn = vi.fn().mockRejectedValue(error);
      
      await expect(retryWithBackoff(fn, { maxAttempts: 2 })).rejects.toThrow('persistent error');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should respect retryable function', async () => {
      const error = new Error('non-retryable');
      const fn = vi.fn().mockRejectedValue(error);
      const retryable = vi.fn().mockReturnValue(false);
      
      await expect(retryWithBackoff(fn, { retryable })).rejects.toThrow('non-retryable');
      expect(fn).toHaveBeenCalledTimes(1);
      expect(retryable).toHaveBeenCalledWith(error);
    });
  });

  describe('isRetryableError', () => {
    it('should identify network errors as retryable', () => {
      expect(isRetryableError(new Error('ECONNRESET'))).toBe(true);
      expect(isRetryableError(new Error('ETIMEDOUT'))).toBe(true);
      expect(isRetryableError(new Error('ENOTFOUND'))).toBe(true);
      expect(isRetryableError(new Error('network error'))).toBe(true);
      expect(isRetryableError(new Error('timeout occurred'))).toBe(true);
    });

    it('should identify 5xx errors as retryable', () => {
      const error500 = new Error('Server error') as any;
      error500.statusCode = 500;
      expect(isRetryableError(error500)).toBe(true);

      const error503 = new Error('Service unavailable') as any;
      error503.statusCode = 503;
      expect(isRetryableError(error503)).toBe(true);
    });

    it('should identify 429 (rate limit) as retryable', () => {
      const error = new Error('Rate limited') as any;
      error.statusCode = 429;
      expect(isRetryableError(error)).toBe(true);
    });

    it('should identify 408 (timeout) as retryable', () => {
      const error = new Error('Request timeout') as any;
      error.statusCode = 408;
      expect(isRetryableError(error)).toBe(true);
    });

    it('should not identify 4xx errors (except 408, 429) as retryable', () => {
      const error400 = new Error('Bad request') as any;
      error400.statusCode = 400;
      expect(isRetryableError(error400)).toBe(false);

      const error404 = new Error('Not found') as any;
      error404.statusCode = 404;
      expect(isRetryableError(error404)).toBe(false);
    });
  });

  describe('retryApiCall', () => {
    it('should use isRetryableError by default', async () => {
      const retryableError = new Error('ECONNRESET');
      const fn = vi.fn()
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValueOnce('success');
      
      const result = await retryApiCall(fn, { maxAttempts: 2 });
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should not retry non-retryable errors', async () => {
      const nonRetryableError = new Error('Bad request') as any;
      nonRetryableError.statusCode = 400;
      const fn = vi.fn().mockRejectedValue(nonRetryableError);
      
      await expect(retryApiCall(fn)).rejects.toThrow('Bad request');
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
});
