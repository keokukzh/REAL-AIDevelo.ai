import { useCallback } from 'react';
import { captureException, captureMessage, addBreadcrumb } from '../lib/sentry';
import { logger } from '../lib/logger';

export interface ErrorHandlerOptions {
  /**
   * Whether to show a user-friendly error message
   */
  showUserMessage?: boolean;
  
  /**
   * Custom user message to display
   */
  userMessage?: string;
  
  /**
   * Whether to report to Sentry
   */
  reportToSentry?: boolean;
  
  /**
   * Additional context for error tracking
   */
  context?: Record<string, unknown>;
  
  /**
   * Log level for the error
   */
  logLevel?: 'error' | 'warn' | 'info';
}

/**
 * Centralized error handler hook for frontend
 * Provides consistent error handling, logging, and Sentry reporting
 */
export function useErrorHandler() {
  /**
   * Handle an error with consistent logging and reporting
   */
  const handleError = useCallback((
    error: Error | unknown,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showUserMessage = false,
      userMessage,
      reportToSentry = true,
      context = {},
      logLevel = 'error',
    } = options;

    // Convert unknown error to Error object
    const errorObj = error instanceof Error 
      ? error 
      : new Error(String(error));

    // Log error using logger utility
    logger[logLevel](
      errorObj.message || 'An error occurred',
      errorObj,
      context
    );

    // Report to Sentry if enabled
    if (reportToSentry) {
      captureException(errorObj, context);
    }

    // Add breadcrumb for debugging
    addBreadcrumb({
      category: 'error',
      message: errorObj.message,
      level: logLevel === 'error' ? 'error' : 'warning',
      data: context,
    });

    // Return user-friendly message if requested
    if (showUserMessage) {
      return userMessage || 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.';
    }

    return null;
  }, []);

  /**
   * Handle an API error with consistent formatting
   */
  const handleApiError = useCallback((
    error: Error | unknown,
    options: ErrorHandlerOptions = {}
  ) => {
    const errorObj = error instanceof Error 
      ? error 
      : new Error(String(error));

    // Extract API error details if available
    const apiContext: Record<string, unknown> = {
      ...options.context,
      type: 'api_error',
    };

    // Check if it's an axios error with response
    if ((error as any).response) {
      apiContext.status = (error as any).response.status;
      apiContext.statusText = (error as any).response.statusText;
      apiContext.url = (error as any).config?.url;
    }

    return handleError(errorObj, {
      ...options,
      context: apiContext,
      userMessage: options.userMessage || 'Die Anfrage konnte nicht verarbeitet werden. Bitte versuchen Sie es später erneut.',
    });
  }, [handleError]);

  /**
   * Handle a network error
   */
  const handleNetworkError = useCallback((
    error: Error | unknown,
    options: ErrorHandlerOptions = {}
  ) => {
    return handleError(error, {
      ...options,
      context: {
        ...options.context,
        type: 'network_error',
      },
      userMessage: options.userMessage || 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.',
    });
  }, [handleError]);

  /**
   * Handle a validation error
   */
  const handleValidationError = useCallback((
    error: Error | unknown,
    validationErrors?: Record<string, string[]>,
    options: ErrorHandlerOptions = {}
  ) => {
    return handleError(error, {
      ...options,
      context: {
        ...options.context,
        type: 'validation_error',
        validationErrors,
      },
      userMessage: options.userMessage || 'Bitte überprüfen Sie Ihre Eingaben.',
      logLevel: 'warn',
      reportToSentry: false, // Don't report validation errors to Sentry
    });
  }, [handleError]);

  /**
   * Log a warning message
   */
  const handleWarning = useCallback((
    message: string,
    context?: Record<string, unknown>
  ) => {
    logger.warn(message, context);
    captureMessage(message, 'warning');
    addBreadcrumb({
      category: 'warning',
      message,
      level: 'warning',
      data: context,
    });
  }, []);

  /**
   * Log an info message
   */
  const handleInfo = useCallback((
    message: string,
    context?: Record<string, unknown>
  ) => {
    logger.info(message, context);
    addBreadcrumb({
      category: 'info',
      message,
      level: 'info',
      data: context,
    });
  }, []);

  return {
    handleError,
    handleApiError,
    handleNetworkError,
    handleValidationError,
    handleWarning,
    handleInfo,
  };
}
