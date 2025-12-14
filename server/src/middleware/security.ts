import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from '../config/env';

/**
 * Security Middleware Configuration
 * Consolidated security settings for the application
 */

/**
 * Helper function to check if origin is allowed
 */
export const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) {
    return true; // Allow requests with no origin (mobile apps, Postman, server-to-server)
  }

  // Production origins
  if (
    origin === 'https://aidevelo.ai' ||
    origin.endsWith('.aidevelo.ai') ||
    origin.endsWith('.pages.dev')
  ) {
    return true;
  }

  // Development origins (only in non-production)
  if (process.env.NODE_ENV !== 'production') {
    if (
      origin === 'http://localhost:4000' ||
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:')
    ) {
      return true;
    }
  }

  return false;
};

/**
 * CORS Configuration
 */
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    const isAllowed = isOriginAllowed(origin);

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Rejected origin: ${origin}`);
      callback(null, false); // Don't throw error, just reject
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
});

/**
 * Explicit OPTIONS handler BEFORE CORS - respond immediately to avoid timeout
 */
export const optionsHandler = (req: Request, res: Response) => {
  const origin = req.headers.origin;
  
  // Use same origin check as CORS middleware
  const isAllowed = isOriginAllowed(origin);

  if (isAllowed && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin'); // Important for cache correctness
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  res.status(200).end();
};

/**
 * Helmet Security Headers
 */
export const helmetMiddleware = config.isProduction
  ? helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
          connectSrc: ["'self'", 'https:']
        }
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    })
  : helmet();

/**
 * Rate Limiting Configuration
 * Per-route rate limits for different endpoint types
 */
const rateLimitConfig: Record<string, { windowMs: number; max: number }> = {
  // Authentication endpoints - strict limits
  '/api/auth/login': { windowMs: 15 * 60 * 1000, max: 5 },
  '/api/auth/register': { windowMs: 60 * 60 * 1000, max: 3 }, // 3 per hour
  '/api/auth/refresh': { windowMs: 15 * 60 * 1000, max: 10 },
  '/api/auth/*': { windowMs: 15 * 60 * 1000, max: 10 },
  
  // Agent endpoints - moderate limits
  '/api/agents': { windowMs: 60 * 1000, max: 30 }, // 30 per minute
  '/api/dashboard': { windowMs: 60 * 1000, max: 60 }, // 60 per minute
  
  // Health and public endpoints - lenient limits
  '/api/health': { windowMs: 60 * 1000, max: 100 },
  '/health': { windowMs: 60 * 1000, max: 100 },
  
  // Default for all other API routes
  '/api/*': { windowMs: 15 * 60 * 1000, max: 100 },
};

/**
 * Get rate limit config for a specific path
 */
function getRateLimitConfig(path: string): { windowMs: number; max: number } {
  // Check exact matches first
  if (rateLimitConfig[path]) {
    return rateLimitConfig[path];
  }
  
  // Check pattern matches (order matters - most specific first)
  const patterns = Object.keys(rateLimitConfig).sort((a, b) => {
    // Sort by specificity (more wildcards = less specific)
    const aWildcards = (a.match(/\*/g) || []).length;
    const bWildcards = (b.match(/\*/g) || []).length;
    return aWildcards - bWildcards;
  });
  
  for (const pattern of patterns) {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      if (regex.test(path)) {
        return rateLimitConfig[pattern];
      }
    }
  }
  
  // Default rate limit
  return { windowMs: 15 * 60 * 1000, max: 100 };
}

/**
 * Create rate limiter instance with custom config
 */
function createRateLimiter(windowMs: number, max: number) {
  return rateLimit({
    windowMs,
    max,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false,
    // Custom handler to add our custom headers
    handler: (req: Request, res: Response) => {
      const resetTime = new Date(Date.now() + windowMs).toISOString();
      res.setHeader('X-RateLimit-Limit', max.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', resetTime);
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests from this IP, please try again later.',
        },
        meta: {
          requestId: req.headers['x-request-id'] || `req-${Date.now()}`,
          timestamp: new Date().toISOString(),
          version: process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || '1.0.0',
        },
      });
    },
    // Skip successful requests (don't count them)
    skipSuccessfulRequests: false,
    // Skip failed requests (don't count them)
    skipFailedRequests: false,
  });
}

/**
 * Per-route rate limiters cache
 */
const rateLimitersCache = new Map<string, ReturnType<typeof createRateLimiter>>();

/**
 * Get or create rate limiter for a path
 */
function getRateLimiter(path: string) {
  const config = getRateLimitConfig(path);
  const key = `${config.windowMs}-${config.max}`;
  
  if (!rateLimitersCache.has(key)) {
    rateLimitersCache.set(key, createRateLimiter(config.windowMs, config.max));
  }
  
  return rateLimitersCache.get(key)!;
}

/**
 * Apply rate limiting to API routes (except health check and OPTIONS preflight)
 */
export const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Skip rate limiting for OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    return next();
  }
  
  // Skip rate limiting for health checks
  if (req.path === '/health' || req.path === '/api/health') {
    return next();
  }
  
  // Apply rate limiting to API routes
  if (req.path.startsWith('/api/') || req.path.startsWith('/api/v1/')) {
    const limiter = getRateLimiter(req.path);
    return limiter(req, res, next);
  }
  
  next();
};

/**
 * Ensure Vary: Origin header is set for CORS responses (cache correctness)
 */
export const varyOriginMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Vary', 'Origin');
  }
  next();
};
