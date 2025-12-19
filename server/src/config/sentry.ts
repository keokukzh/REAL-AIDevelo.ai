import * as Sentry from '@sentry/node';
import { config } from './env';

/**
 * Initialize Sentry for error tracking and performance monitoring
 */
export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  
  if (!dsn) {
    // Sentry is optional - log warning but don't fail
    // Note: Can't use StructuredLoggingService here as it may not be initialized yet
    if (config.nodeEnv === 'development') {
      // eslint-disable-next-line no-console
      console.warn('[Sentry] SENTRY_DSN not configured - error tracking disabled');
    }
    return;
  }

  Sentry.init({
    dsn,
    environment: config.nodeEnv || 'development',
    tracesSampleRate: config.isProduction ? 0.1 : 1.0, // 10% in prod, 100% in dev
    profilesSampleRate: config.isProduction ? 0.1 : 1.0,
    
    // Filter out health check endpoints
    ignoreErrors: [
      'ECONNREFUSED',
      'ENOTFOUND',
    ],
    
    // Don't send errors from localhost in production
    beforeSend(event, hint) {
      // In production, filter out localhost errors
      if (config.isProduction && event.request?.url?.includes('localhost')) {
        return null;
      }
      return event;
    },
    
    // Integrate with Express
    integrations: [
      Sentry.httpIntegration(),
      Sentry.expressIntegration(),
    ],
  });
}

/**
 * Capture exception and send to Sentry
 */
export function captureException(error: Error, context?: Record<string, unknown>): void {
  if (context) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, { [key]: value });
      });
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}

/**
 * Capture message and send to Sentry
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
  Sentry.captureMessage(message, level);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
  Sentry.addBreadcrumb(breadcrumb);
}

/**
 * Set user context for error tracking
 */
export function setUser(user: { id?: string; email?: string; username?: string }): void {
  Sentry.setUser(user);
}

/**
 * Clear user context
 */
export function clearUser(): void {
  Sentry.setUser(null);
}
