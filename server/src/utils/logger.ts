/**
 * Standardized Logger Utility
 * 
 * Provides consistent logging interface with:
 * - Structured logging via StructuredLoggingService
 * - Error serialization
 * - Secret redaction
 * - Request context support
 */

import { StructuredLoggingService, LogContext } from '../services/loggingService';
import { Request } from 'express';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Serialize error for logging
 */
export function serializeError(err: unknown): Record<string, unknown> | null {
  if (!err) return null;
  
  if (err instanceof Error) {
    const serialized: Record<string, unknown> = {
      name: err.name,
      message: err.message,
    };
    
    if (err.stack) {
      serialized.stack = err.stack.split('\n').slice(0, 10).join('\n'); // First 10 lines
    }
    
    // Extract additional error properties
    if ((err as any).code) serialized.code = (err as any).code;
    if ((err as any).statusCode) serialized.statusCode = (err as any).statusCode;
    if ((err as any).supabase) serialized.supabase = (err as any).supabase;
    if ((err as any).cause) serialized.cause = (err as any).cause;
    
    return serialized;
  }
  
  return { message: String(err) };
}

/**
 * Keys that should be redacted from logs
 */
const SECRET_KEYS = new Set([
  'authorization',
  'token',
  'access_token',
  'refresh_token',
  'TWILIO_STREAM_TOKEN',
  'SMTP_PASS',
  'GOOGLE_OAUTH_CLIENT_SECRET',
  'QDRANT_API_KEY',
  'ELEVENLABS_API_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'password',
  'secret',
  'api_key',
  'apikey',
]);

/**
 * Redact sensitive data from context object
 */
export function redact(obj: Record<string, unknown> | null | undefined): Record<string, unknown> {
  if (!obj) return {};
  
  const out: Record<string, unknown> = {};
  
  for (const [k, v] of Object.entries(obj)) {
    const keyLower = k.toLowerCase();
    
    // Redact if key matches secret patterns
    if (SECRET_KEYS.has(keyLower) || keyLower.includes('secret') || keyLower.includes('password')) {
      out[k] = '[REDACTED]';
    } else if (typeof v === 'object' && v !== null && !Array.isArray(v) && !(v instanceof Date)) {
      // Recursively redact nested objects
      out[k] = redact(v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  
  return out;
}

/**
 * Logger instance wrapper around StructuredLoggingService
 */
export const logger = {
  /**
   * Log debug message
   */
  debug(message: string, context: LogContext = {}, req?: Request): void {
    StructuredLoggingService.debug(message, context, req);
  },

  /**
   * Log info message
   */
  info(message: string, context: LogContext = {}, req?: Request): void {
    StructuredLoggingService.info(message, context, req);
  },

  /**
   * Log warning message
   */
  warn(message: string, context: LogContext = {}, req?: Request): void {
    StructuredLoggingService.warn(message, context, req);
  },

  /**
   * Log error message
   */
  error(
    message: string,
    error?: Error | unknown,
    context: LogContext = {},
    req?: Request
  ): void {
    const errorObj = error instanceof Error ? error : undefined;
    StructuredLoggingService.error(message, errorObj, context, req);
  },
};
