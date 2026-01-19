import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Request logging middleware
 * Logs all requests with duration, status, and user info
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  // Normalize requestId to always be a string (headers can be string | string[])
  const requestIdHeader = req.headers['x-request-id'];
  const requestId = Array.isArray(requestIdHeader) 
    ? requestIdHeader[0] 
    : (requestIdHeader || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  
  // Attach request ID to request object
  (req as any).requestId = requestId;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      user: (req as any).supabaseUser?.supabaseUserId || 'anonymous',
      requestId,
      timestamp: new Date().toISOString(),
    };

    // Log based on status code
    if (res.statusCode >= 500) {
      logger.error('request.server_error', new Error(`Server error: ${req.method} ${req.path}`), logData, req);
    } else if (res.statusCode >= 400) {
      logger.warn('request.client_error', logData, req);
    } else {
      logger.info('request.completed', logData, req);
    }

    // Alert if request took too long
    if (duration > 10000) {
      logger.warn('request.slow_request', {
        ...logData,
        warning: `Request took ${duration}ms (threshold: 10000ms)`,
      }, req);
    }
  });

  next();
};
