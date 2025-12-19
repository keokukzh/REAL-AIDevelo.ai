/**
 * Application Constants
 * Centralized configuration constants to avoid magic numbers throughout the codebase
 */

/**
 * Database Connection Pool Configuration
 */
export const DATABASE_POOL = {
  MAX_CONNECTIONS: 10,
  MIN_CONNECTIONS: 2,
  IDLE_TIMEOUT_MS: 30000,
  CONNECTION_TIMEOUT_MS: 10000,
  QUERY_TIMEOUT_MS: 30000,
  KEEP_ALIVE_INITIAL_DELAY_MS: 0,
} as const;

/**
 * Request Timeout Configuration (in milliseconds)
 */
export const REQUEST_TIMEOUTS = {
  HEALTH_CHECK: 5000,
  VOICE_AGENT: 60000,
  FILE_UPLOAD: 120000,
  KNOWLEDGE_SCRAPE: 30000,
  CALENDAR: 15000,
  ELEVENLABS: 30000,
  DEFAULT: 30000,
  SLOW_REQUEST_THRESHOLD_MULTIPLIER: 0.8, // Log if request takes > 80% of timeout
} as const;

/**
 * Rate Limiting Configuration
 */
export const RATE_LIMITS = {
  AUTH_LOGIN: { windowMs: 15 * 60 * 1000, max: 5 },
  AUTH_REGISTER: { windowMs: 60 * 60 * 1000, max: 3 },
  AUTH_REFRESH: { windowMs: 15 * 60 * 1000, max: 10 },
  AUTH_DEFAULT: { windowMs: 15 * 60 * 1000, max: 10 },
  AGENTS: { windowMs: 60 * 1000, max: 30 },
  DASHBOARD: { windowMs: 60 * 1000, max: 60 },
  HEALTH: { windowMs: 60 * 1000, max: 100 },
  DEFAULT: { windowMs: 15 * 60 * 1000, max: 100 },
} as const;

/**
 * Retry Configuration
 */
export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  INITIAL_DELAY_MS: 1000,
  MAX_DELAY_MS: 10000,
  BACKOFF_MULTIPLIER: 2,
} as const;

/**
 * External API Timeouts (in milliseconds)
 */
export const API_TIMEOUTS = {
  ELEVENLABS: 30000,
  ELEVENLABS_VOICE_FETCH: 10000,
  ELEVENLABS_AGENT_CREATION: 30000,
  ELEVENLABS_VOICE_CLONE: 60000,
  TWILIO: 10000,
  GOOGLE_CALENDAR: 15000,
  QDRANT: 2000,
  DEFAULT: 10000,
} as const;

/**
 * Request/Response Size Limits
 */
export const SIZE_LIMITS = {
  JSON_BODY_MB: 10,
  URL_ENCODED_BODY_MB: 10,
} as const;

/**
 * Query Performance Monitoring
 */
export const QUERY_MONITORING = {
  SLOW_QUERY_THRESHOLD_MS: 1000,
  MAX_QUERY_TIMINGS: 1000,
} as const;

/**
 * Circuit Breaker Configuration
 */
export const CIRCUIT_BREAKER = {
  FAILURE_THRESHOLD: 5,
  HALF_OPEN_DELAY_MS: 30000,
  RESET_TIMEOUT_MS: 60000,
} as const;

/**
 * Cache Configuration
 */
export const CACHE_CONFIG = {
  DASHBOARD_OVERVIEW_TTL_SEC: 30,
  DEFAULT_TTL_SEC: 60,
} as const;

/**
 * Pagination Defaults
 */
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  ANALYTICS_EXPORT_MAX_LIMIT: 10000,
} as const;

/**
 * Migration Configuration
 */
export const MIGRATION_CONFIG = {
  MAX_RETRIES: 10,
  RETRY_DELAY_MS: 2000,
  CONNECTION_TIMEOUT_MS: 10000,
} as const;

/**
 * Performance Monitoring
 */
export const PERFORMANCE = {
  SLOW_REQUEST_THRESHOLD_MS: 1000,
  PERCENTILE_P50: 0.5,
  PERCENTILE_P95: 0.95,
  PERCENTILE_P99: 0.99,
} as const;
