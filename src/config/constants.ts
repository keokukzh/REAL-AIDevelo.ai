/**
 * Frontend Application Constants
 * Centralized configuration constants to avoid magic numbers throughout the codebase
 */

/**
 * Calendar OAuth Window Configuration
 */
export const CALENDAR_OAUTH_WINDOW = {
  WIDTH: 600,
  HEIGHT: 700,
} as const;

/**
 * API Configuration
 */
export const API_CONFIG = {
  TIMEOUT_MS: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
} as const;

/**
 * Polling Intervals (in milliseconds)
 */
export const POLLING_INTERVALS = {
  DASHBOARD_OVERVIEW: 30000, // 30 seconds
  CALENDAR_EVENTS: 60000, // 1 minute
  CALL_LOGS: 30000, // 30 seconds
  AGENT_STATUS: 10000, // 10 seconds
} as const;

/**
 * Audio Configuration
 */
export const AUDIO_CONFIG = {
  SAMPLE_RATE: 16000,
  BUFFER_SIZE: 4096,
  MAX_RECORDING_DURATION_MS: 60000, // 1 minute
} as const;

/**
 * File Upload Limits
 */
export const FILE_UPLOAD_LIMITS = {
  MAX_SIZE_MB: 10,
  ALLOWED_AUDIO_TYPES: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
} as const;

/**
 * UI Configuration
 */
export const UI_CONFIG = {
  TOAST_DURATION_MS: 5000,
  DEBOUNCE_DELAY_MS: 300,
  ANIMATION_DURATION_MS: 300,
} as const;
