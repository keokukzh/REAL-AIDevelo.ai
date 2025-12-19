import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CircuitBreaker } from '../circuitBreaker';

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    vi.useFakeTimers();
    circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeout: 5000,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should execute function when circuit is closed', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await circuitBreaker.execute(fn);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should open circuit after failure threshold', async () => {
    const error = new Error('Service error');
    const fn = vi.fn().mockRejectedValue(error);

    // Fail 3 times (threshold)
    for (let i = 0; i < 3; i++) {
      await expect(circuitBreaker.execute(fn)).rejects.toThrow('Service error');
    }

    // Circuit should be open now
    await expect(circuitBreaker.execute(fn)).rejects.toThrow('Circuit breaker is open');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should transition to half-open after reset timeout', async () => {
    const error = new Error('Service error');
    const fn = vi.fn().mockRejectedValue(error);

    // Open the circuit
    for (let i = 0; i < 3; i++) {
      await expect(circuitBreaker.execute(fn)).rejects.toThrow('Service error');
    }

    // Fast-forward time past reset timeout
    vi.advanceTimersByTime(5000);

    // Circuit should be half-open, allow one attempt
    const successFn = vi.fn().mockResolvedValue('success');
    const result = await circuitBreaker.execute(successFn);
    expect(result).toBe('success');
    expect(successFn).toHaveBeenCalledTimes(1);
  });

  it('should close circuit after successful half-open attempt', async () => {
    const error = new Error('Service error');
    const failFn = vi.fn().mockRejectedValue(error);
    const successFn = vi.fn().mockResolvedValue('success');

    // Open the circuit
    for (let i = 0; i < 3; i++) {
      await expect(circuitBreaker.execute(failFn)).rejects.toThrow('Service error');
    }

    // Fast-forward time
    vi.advanceTimersByTime(5000);

    // Successful half-open attempt should close circuit
    await circuitBreaker.execute(successFn);
    
    // Circuit should be closed, allow normal execution
    const result = await circuitBreaker.execute(successFn);
    expect(result).toBe('success');
    expect(successFn).toHaveBeenCalledTimes(2);
  });

  it('should reopen circuit if half-open attempt fails', async () => {
    const error = new Error('Service error');
    const fn = vi.fn().mockRejectedValue(error);

    // Open the circuit
    for (let i = 0; i < 3; i++) {
      await expect(circuitBreaker.execute(fn)).rejects.toThrow('Service error');
    }

    // Fast-forward time
    vi.advanceTimersByTime(5000);

    // Half-open attempt fails, should reopen
    await expect(circuitBreaker.execute(fn)).rejects.toThrow('Service error');
    
    // Circuit should be open again
    await expect(circuitBreaker.execute(fn)).rejects.toThrow('Circuit breaker is open');
  });
});
