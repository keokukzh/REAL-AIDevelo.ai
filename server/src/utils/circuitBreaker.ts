import { CIRCUIT_BREAKER } from '../config/constants';

export enum CircuitState {
  CLOSED = 'closed', // Normal operation
  OPEN = 'open', // Failing, reject requests immediately
  HALF_OPEN = 'half-open', // Testing if service recovered
}

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeoutMs?: number;
  halfOpenDelayMs?: number;
}

/**
 * Circuit Breaker implementation for external service calls
 * Prevents cascading failures by stopping requests when service is down
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;
  private readonly halfOpenDelayMs: number;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold || CIRCUIT_BREAKER.FAILURE_THRESHOLD;
    this.resetTimeoutMs = options.resetTimeoutMs || CIRCUIT_BREAKER.RESET_TIMEOUT_MS;
    this.halfOpenDelayMs = options.halfOpenDelayMs || CIRCUIT_BREAKER.HALF_OPEN_DELAY_MS;
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check circuit state
    if (this.state === CircuitState.OPEN) {
      // Check if enough time has passed to try half-open
      if (this.lastFailureTime && Date.now() - this.lastFailureTime >= this.halfOpenDelayMs) {
        this.state = CircuitState.HALF_OPEN;
      } else {
        throw new Error('Circuit breaker is OPEN - service unavailable');
      }
    }

    try {
      const result = await fn();
      
      // Success - reset circuit breaker
      if (this.state === CircuitState.HALF_OPEN) {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.lastFailureTime = null;
      } else if (this.state === CircuitState.CLOSED) {
        // Reset failure count on success
        this.failureCount = 0;
      }
      
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  /**
   * Record a failure and update circuit state
   */
  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = CircuitState.OPEN;
    }
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    // Auto-transition from OPEN to HALF_OPEN after delay
    if (this.state === CircuitState.OPEN && this.lastFailureTime) {
      if (Date.now() - this.lastFailureTime >= this.halfOpenDelayMs) {
        this.state = CircuitState.HALF_OPEN;
      }
    }
    
    return this.state;
  }

  /**
   * Reset circuit breaker manually
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = null;
  }

  /**
   * Get failure count
   */
  getFailureCount(): number {
    return this.failureCount;
  }
}

/**
 * Circuit breaker instances for external services
 */
export const circuitBreakers = {
  elevenLabs: new CircuitBreaker(),
  twilio: new CircuitBreaker(),
  googleCalendar: new CircuitBreaker(),
};
