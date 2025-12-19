import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { QUERY_MONITORING } from '../config/constants';

/**
 * Query performance monitoring configuration
 */
const SLOW_QUERY_THRESHOLD_MS = QUERY_MONITORING.SLOW_QUERY_THRESHOLD_MS;
const QUERY_LOG_INTERVAL_MS = 5000; // Log query stats every 5 seconds
const MAX_QUERY_TIMINGS = QUERY_MONITORING.MAX_QUERY_TIMINGS;

/**
 * Query timing data structure
 */
interface QueryTiming {
  query: string;
  duration: number;
  timestamp: number;
}

/**
 * In-memory store for query timings (for aggregation)
 * In production, consider using Redis or a time-series database
 */
const queryTimings: QueryTiming[] = [];
let lastLogTime = Date.now();

/**
 * Log slow queries and aggregate statistics
 */
function logQueryStats() {
  const now = Date.now();
  if (now - lastLogTime < QUERY_LOG_INTERVAL_MS) {
    return;
  }

  if (queryTimings.length === 0) {
    lastLogTime = now;
    return;
  }

  // Calculate percentiles
  const sorted = [...queryTimings].sort((a, b) => a.duration - b.duration);
  const p50Index = Math.floor(sorted.length * 0.5);
  const p95Index = Math.floor(sorted.length * 0.95);
  const p99Index = Math.floor(sorted.length * 0.99);
  const p50 = sorted.at(p50Index)?.duration || 0;
  const p95 = sorted.at(p95Index)?.duration || 0;
  const p99 = sorted.at(p99Index)?.duration || 0;
  const max = sorted.at(-1)?.duration || 0;
  const avg = sorted.reduce((sum, q) => sum + q.duration, 0) / sorted.length;

  // Count slow queries
  const slowQueries = queryTimings.filter(q => q.duration > SLOW_QUERY_THRESHOLD_MS);

  logger.info('query.performance.stats', {
    totalQueries: queryTimings.length,
    slowQueries: slowQueries.length,
    p50,
    p95,
    p99,
    max,
    avg: Math.round(avg),
  });

  // Log slow queries individually
  if (slowQueries.length > 0) {
    slowQueries.forEach(query => {
      logger.warn('query.performance.slow', {
        query: query.query.substring(0, 200), // Truncate long queries
        duration: query.duration,
        threshold: SLOW_QUERY_THRESHOLD_MS,
      });
    });
  }

  // Clear old entries (keep last N for rolling window)
  queryTimings.splice(0, Math.max(0, queryTimings.length - MAX_QUERY_TIMINGS));
  lastLogTime = now;
}

/**
 * Monitor Supabase query performance
 * Wraps Supabase client queries to track performance
 */
export function monitorSupabaseQuery(
  queryDescription: string,
  queryFn: () => Promise<any>
): Promise<any> {
  const startTime = Date.now();
  
  return queryFn()
    .then(result => {
      const duration = Date.now() - startTime;
      
      // Store timing
      queryTimings.push({
        query: queryDescription,
        duration,
        timestamp: Date.now(),
      });

      // Log slow queries immediately and send to Sentry
      if (duration > SLOW_QUERY_THRESHOLD_MS) {
        logger.warn('query.performance.slow', {
          query: queryDescription,
          duration,
          threshold: SLOW_QUERY_THRESHOLD_MS,
        });
        
        // Send slow query metric to Sentry
        try {
          const { captureMessage } = require('../config/sentry');
          captureMessage(`Slow query detected: ${queryDescription.substring(0, 100)}`, 'warning');
        } catch {
          // Sentry not available, ignore
        }
      }

      // Log aggregated stats periodically
      logQueryStats();

      return result;
    })
    .catch(error => {
      const duration = Date.now() - startTime;
      
      logger.error('query.performance.error', {
        query: queryDescription,
        duration,
        error: error.message,
      });

      throw error;
    });
}

/**
 * Express middleware to track request-level query performance
 * Tracks all queries made during a request
 */
export const queryMonitorMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestStartTime = Date.now();
  const requestQueries: Array<{ query: string; duration: number }> = [];

  // Store original methods
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  // Track queries made during this request
  (req as any).trackQuery = (query: string, duration: number) => {
    requestQueries.push({ query, duration });
  };

  // Override response methods to log request-level stats
  res.json = function(body: unknown) {
    const requestDuration = Date.now() - requestStartTime;
    
    // Log if request had slow queries or took too long
    if (requestQueries.length > 0) {
      const totalQueryTime = requestQueries.reduce((sum, q) => sum + q.duration, 0);
      const slowQueries = requestQueries.filter(q => q.duration > SLOW_QUERY_THRESHOLD_MS);

      if (slowQueries.length > 0 || totalQueryTime > SLOW_QUERY_THRESHOLD_MS) {
        logger.warn('request.performance.slow_queries', {
          method: req.method,
          path: req.path,
          requestDuration,
          queryCount: requestQueries.length,
          totalQueryTime,
          slowQueryCount: slowQueries.length,
          queries: requestQueries.map(q => ({
            query: q.query.substring(0, 100),
            duration: q.duration,
          })),
        });
      }
    }

    return originalJson(body);
  };

  res.send = function(body: unknown) {
    const requestDuration = Date.now() - requestStartTime;
    
    if (requestQueries.length > 0) {
      const totalQueryTime = requestQueries.reduce((sum, q) => sum + q.duration, 0);
      const slowQueries = requestQueries.filter(q => q.duration > SLOW_QUERY_THRESHOLD_MS);

      if (slowQueries.length > 0 || totalQueryTime > SLOW_QUERY_THRESHOLD_MS) {
        logger.warn('request.performance.slow_queries', {
          method: req.method,
          path: req.path,
          requestDuration,
          queryCount: requestQueries.length,
          totalQueryTime,
          slowQueryCount: slowQueries.length,
        });
      }
    }

    return originalSend(body);
  };

  next();
};

/**
 * Get current query performance statistics
 */
export function getQueryStats() {
  if (queryTimings.length === 0) {
    return {
      totalQueries: 0,
      slowQueries: 0,
      p50: 0,
      p95: 0,
      p99: 0,
      max: 0,
      avg: 0,
    };
  }

  const sorted = [...queryTimings].sort((a, b) => a.duration - b.duration);
  const p50Index = Math.floor(sorted.length * 0.5);
  const p95Index = Math.floor(sorted.length * 0.95);
  const p99Index = Math.floor(sorted.length * 0.99);
  const p50 = sorted.at(p50Index)?.duration || 0;
  const p95 = sorted.at(p95Index)?.duration || 0;
  const p99 = sorted.at(p99Index)?.duration || 0;
  const max = sorted.at(-1)?.duration || 0;
  const avg = sorted.reduce((sum, q) => sum + q.duration, 0) / sorted.length;
  const slowQueries = queryTimings.filter(q => q.duration > SLOW_QUERY_THRESHOLD_MS).length;

  return {
    totalQueries: queryTimings.length,
    slowQueries,
    p50,
    p95,
    p99,
    max,
    avg: Math.round(avg),
  };
}
