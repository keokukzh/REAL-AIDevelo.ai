import { Request, Response, NextFunction } from 'express';
import { sendFailure } from '../utils/apiResponse';
import { REQUEST_TIMEOUTS } from '../config/constants';
import { StructuredLoggingService } from '../services/loggingService';

/**
 * Timeout configuration per route (in milliseconds)
 */
const timeoutConfig: Record<string, number> = {
  '/api/health': REQUEST_TIMEOUTS.HEALTH_CHECK,
  '/health': REQUEST_TIMEOUTS.HEALTH_CHECK,
  '/api/voice-agent/*': REQUEST_TIMEOUTS.VOICE_AGENT,
  '/api/knowledge/upload': REQUEST_TIMEOUTS.FILE_UPLOAD,
  '/api/knowledge/scrape': REQUEST_TIMEOUTS.KNOWLEDGE_SCRAPE,
  '/api/calendar/*': REQUEST_TIMEOUTS.CALENDAR,
  '/api/elevenlabs/*': REQUEST_TIMEOUTS.ELEVENLABS,
  '/api/*': REQUEST_TIMEOUTS.DEFAULT,
};

/**
 * Get timeout for a specific route
 */
function getTimeout(path: string): number {
  // Check exact matches first
  if (timeoutConfig[path]) {
    return timeoutConfig[path];
  }

  // Check pattern matches (most specific first)
  const patterns = Object.keys(timeoutConfig)
    .filter(key => key.includes('*'))
    .sort((a, b) => {
      // Sort by specificity (fewer wildcards = more specific)
      const aWildcards = (a.match(/\*/g) || []).length;
      const bWildcards = (b.match(/\*/g) || []).length;
      return aWildcards - bWildcards;
    });

  for (const pattern of patterns) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    if (regex.test(path)) {
      return timeoutConfig[pattern];
    }
  }

  // Default timeout
  return REQUEST_TIMEOUTS.DEFAULT;
}

/**
 * Request Timeout Middleware
 * Sets a timeout for requests and returns 504 Gateway Timeout if exceeded
 */
export const timeoutMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const timeout = getTimeout(req.path);
  let timeoutId: NodeJS.Timeout | null = null;
  let isTimedOut = false;

  // Set timeout
  timeoutId = setTimeout(() => {
    isTimedOut = true;
    
    // Log slow request
    console.warn('[TimeoutMiddleware] Request timeout', {
      method: req.method,
      path: req.path,
      timeout,
      requestId: req.headers['x-request-id'],
    });

    // If response hasn't been sent, send timeout error
    if (!res.headersSent) {
      sendFailure(
        res,
        504,
        'Gateway Timeout',
        {
          message: `Request exceeded timeout of ${timeout}ms`,
          timeout,
          path: req.path,
        },
        'GATEWAY_TIMEOUT'
      );
    }
  }, timeout);

      // Override res.end to clear timeout when response is sent
      const originalEnd = res.end.bind(res);
      (res as any).end = function(chunk?: any, encoding?: BufferEncoding | (() => void), cb?: () => void) {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        // Log request duration if it was close to timeout
        if (!isTimedOut) {
          const duration = Date.now() - (req as any).startTime;
          if (duration > timeout * REQUEST_TIMEOUTS.SLOW_REQUEST_THRESHOLD_MULTIPLIER) {
            StructuredLoggingService.warn(
              'Slow request detected',
              {
                method: req.method,
                path: req.path,
                duration,
                timeout,
                requestId: Array.isArray(req.headers['x-request-id']) 
                  ? req.headers['x-request-id'][0] 
                  : req.headers['x-request-id'],
              },
              req
            );
          }
        }

        // Handle Express res.end() overloads
        if (typeof encoding === 'function') {
          // res.end(cb) or res.end(chunk, cb)
          return originalEnd(chunk, encoding);
        } else if (encoding && typeof chunk === 'string') {
          // res.end(chunk, encoding, cb)
          return originalEnd(chunk, encoding, cb);
        } else if (chunk) {
          // res.end(chunk, cb)
          return originalEnd(chunk, cb);
        } else {
          // res.end(cb)
          return originalEnd(cb);
        }
      };

  // Store start time for duration tracking
  (req as any).startTime = Date.now();

  next();
};
