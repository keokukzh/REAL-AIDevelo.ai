import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { cacheService } from '../services/cacheService';

/**
 * Cache configuration for different routes
 */
const cacheConfig: Record<string, { ttl: number; vary?: string[] }> = {
  '/api/elevenlabs/voices': { ttl: 3600 }, // 1 hour
  '/api/health': { ttl: 60 }, // 1 minute
  '/health': { ttl: 60 }, // 1 minute
  '/api': { ttl: 300 }, // 5 minutes
};

/**
 * Generate ETag from response body
 */
function generateETag(body: string): string {
  return `"${crypto.createHash('md5').update(body).digest('hex')}"`;
}

/**
 * Get cache key for request
 */
function getCacheKey(req: Request): string {
  const path = req.path;
  const query = req.url.split('?')[1] || '';
  const varyHeaders: string[] = [];
  
  // Check if route has vary configuration
  const config = cacheConfig[path] || cacheConfig['/api'];
  if (config?.vary) {
    for (const header of config.vary) {
      const value = req.headers[header.toLowerCase()];
      if (value) {
        varyHeaders.push(`${header}:${value}`);
      }
    }
  }
  
  const varyStr = varyHeaders.length > 0 ? `:${varyHeaders.join(':')}` : '';
  return `http:cache:${req.method}:${path}:${query}${varyStr}`;
}

/**
 * Get cache TTL for route
 */
function getCacheTTL(path: string): number {
  return cacheConfig[path]?.ttl || cacheConfig['/api']?.ttl || 300;
}

/**
 * HTTP Response Cache Middleware
 * Caches GET requests based on route and supports ETag for conditional requests
 */
export const cacheMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Only cache GET requests
  if (req.method !== 'GET') {
    return next();
  }

  // Skip caching for authenticated routes (unless explicitly configured)
  if (req.path.startsWith('/api/') && !cacheConfig[req.path]) {
    // Check if route should be cached (public endpoints only)
    const publicRoutes = ['/api/health', '/api/elevenlabs/voices', '/api'];
    if (!publicRoutes.some(route => req.path.startsWith(route))) {
      return next();
    }
  }

  const cacheKey = getCacheKey(req);
  const ttl = getCacheTTL(req.path);

  // Check for If-None-Match header (ETag)
  const ifNoneMatch = req.headers['if-none-match'];

  // Try to get cached response
  cacheService.get<{ body: string; etag: string; headers: Record<string, string> }>(cacheKey)
    .then(cached => {
      if (cached) {
        // Check if client has matching ETag
        if (ifNoneMatch && cached.etag === ifNoneMatch) {
          // 304 Not Modified
          res.setHeader('ETag', cached.etag);
          res.setHeader('Cache-Control', `public, max-age=${ttl}`);
          res.status(304).end();
          return;
        }

        // Return cached response
        res.setHeader('ETag', cached.etag);
        res.setHeader('Cache-Control', `public, max-age=${ttl}`);
        res.setHeader('X-Cache', 'HIT');
        
        // Restore cached headers
        for (const [key, value] of Object.entries(cached.headers)) {
          res.setHeader(key, value);
        }
        
        res.send(cached.body);
        return;
      }

      // No cache hit - proceed with request
      // Store original methods to intercept response
      const originalJson = res.json.bind(res);
      const originalSend = res.send.bind(res);
      const originalEnd = res.end.bind(res);

      const responseHeaders: Record<string, string> = {};
      let responseBody: string = '';

      // Intercept headers
      const originalSetHeader = res.setHeader.bind(res);
      res.setHeader = function(name: string, value: string | number | string[]) {
        const headerValue = Array.isArray(value) ? value.join(', ') : String(value);
        responseHeaders[name.toLowerCase()] = headerValue;
        return originalSetHeader(name, value);
      };

      // Intercept json
      res.json = function(body: unknown) {
        responseBody = JSON.stringify(body);
        res.setHeader('Content-Type', 'application/json');
        return originalJson(body);
      };

      // Intercept send
      res.send = function(body: unknown) {
        if (typeof body === 'string') {
          responseBody = body;
        } else {
          responseBody = JSON.stringify(body);
        }
        return originalSend(body);
      };

      // Intercept end
      res.end = function(chunk?: unknown) {
        if (chunk) {
          if (typeof chunk === 'string') {
            responseBody = chunk;
          } else if (Buffer.isBuffer(chunk)) {
            responseBody = chunk.toString();
          }
        }

        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300 && responseBody) {
          const etag = generateETag(responseBody);
          
          // Cache the response
          cacheService.set(
            cacheKey,
            {
              body: responseBody,
              etag,
              headers: responseHeaders,
            },
            ttl
          ).catch(err => {
            console.warn('[CacheMiddleware] Failed to cache response:', err.message);
          });

          // Set ETag header
          res.setHeader('ETag', etag);
          res.setHeader('Cache-Control', `public, max-age=${ttl}`);
          res.setHeader('X-Cache', 'MISS');
        }

        return originalEnd(chunk);
      };

      next();
    })
    .catch(err => {
      console.warn('[CacheMiddleware] Cache error:', err.message);
      // Continue without caching on error
      next();
    });
};

/**
 * Clear cache for a specific pattern
 */
export const clearCache = async (pattern: string): Promise<void> => {
  await cacheService.invalidate(`http:cache:${pattern}`);
};
