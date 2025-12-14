import { Request, Response, NextFunction } from 'express';
import { sendFailure } from '../utils/apiResponse';

/**
 * Timeout configuration per route (in milliseconds)
 */
const timeoutConfig: Record<string, number> = {
  '/api/health': 5000,           // 5 seconds
  '/health': 5000,                // 5 seconds
  '/api/voice-agent/*': 60000,   // 60 seconds (WebSocket/streaming)
  '/api/knowledge/upload': 120000, // 120 seconds (file uploads)
  '/api/knowledge/scrape': 30000,  // 30 seconds
  '/api/calendar/*': 15000,       // 15 seconds
  '/api/elevenlabs/*': 30000,     // 30 seconds
  '/api/*': 30000,                // 30 seconds default
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
  return 30000; // 30 seconds
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
  res.end = function(chunk?: unknown, encoding?: unknown) {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    // Log request duration if it was close to timeout
    if (!isTimedOut) {
      const duration = Date.now() - (req as any).startTime;
      if (duration > timeout * 0.8) {
        console.warn('[TimeoutMiddleware] Slow request detected', {
          method: req.method,
          path: req.path,
          duration,
          timeout,
          requestId: req.headers['x-request-id'],
        });
      }
    }

    return originalEnd(chunk, encoding);
  };

  // Store start time for duration tracking
  (req as any).startTime = Date.now();

  next();
};
