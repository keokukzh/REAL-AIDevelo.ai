/**
 * Frontend logging utility with environment-based logging levels
 * 
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.debug('Debug message', { data });
 *   logger.info('Info message', { data });
 *   logger.warn('Warning message', { data });
 *   logger.error('Error message', { error });
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private isProduction = import.meta.env.PROD;
  private enableDebugLogs = import.meta.env.VITE_DEBUG_LOGS === 'true';

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) {
      return true; // Log everything in development
    }

    if (this.isProduction) {
      // In production, only log warnings and errors
      return level === 'warn' || level === 'error';
    }

    // In other environments, respect VITE_DEBUG_LOGS flag
    if (this.enableDebugLogs) {
      return true;
    }

    return level === 'warn' || level === 'error';
  }

  private formatMessage(prefix: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${prefix}] ${timestamp} ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog('debug')) return;
    console.debug(this.formatMessage('DEBUG', message, context));
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog('info')) return;
    console.info(this.formatMessage('INFO', message, context));
  }

  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog('warn')) return;
    console.warn(this.formatMessage('WARN', message, context));
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (!this.shouldLog('error')) return;
    
    const errorContext: LogContext = {
      ...context,
      ...(error instanceof Error
        ? {
            errorName: error.name,
            errorMessage: error.message,
            errorStack: this.isDevelopment ? error.stack : undefined,
          }
        : { error: String(error) }),
    };
    
    console.error(this.formatMessage('ERROR', message, errorContext));
  }
}

export const logger = new Logger();

