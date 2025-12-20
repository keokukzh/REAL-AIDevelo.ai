import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from '../config/env';
import { RATE_LIMITS } from '../config/constants';
import { StructuredLoggingService } from '../services/loggingService';

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

  // Production origins - restrict to specific domains
  if (config.isProduction) {
    const allowedProductionOrigins = [
      'https://aidevelo.ai',
      'https://www.aidevelo.ai',
      // Add specific Cloudflare Pages domains if needed
      // 'https://your-project.pages.dev',
    ];
    
    // Check exact matches first
    if (allowedProductionOrigins.includes(origin)) {
      return true;
    }
    
    // Allow subdomains of aidevelo.ai
    if (origin.endsWith('.aidevelo.ai')) {
      return true;
    }
    
    // In production, be more restrictive - only allow known patterns
    // Remove wildcard .pages.dev for better security
    return false;
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
      // Note: req is not available in CORS origin callback, so we log without it
      StructuredLoggingService.warn(`CORS rejected origin: ${origin}`, { origin });
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
          scriptSrc: [
            "'self'",
            "'unsafe-inline'", // Required for React
            'https://*.supabase.co',
            'https://fonts.googleapis.com',
            'https://fonts.gstatic.com',
            'https://unpkg.com', // ElevenLabs widget
            'https://www.googletagmanager.com', // GA4
            'https://plausible.io', // Plausible Analytics
          ],
          styleSrc: [
            "'self'",
            "'unsafe-inline'", // Required for React
            'https://fonts.googleapis.com',
          ],
          fontSrc: [
            "'self'",
            'https://fonts.gstatic.com',
          ],
          imgSrc: [
            "'self'",
            'data:',
            'https:', // Allow all HTTPS images (Unsplash, etc.)
            'blob:',
          ],
          connectSrc: [
            "'self'",
            'https://*.supabase.co',
            'https://*.supabase.io',
            'wss://*.supabase.co',
            'https://*.elevenlabs.io', // Allow all ElevenLabs regional endpoints (api.elevenlabs.io, api.us.elevenlabs.io, etc.)
            'wss://*.elevenlabs.io', // WebSocket connections to ElevenLabs
            'https://www.google-analytics.com', // GA4
            'https://www.googletagmanager.com', // GA4
            'https://plausible.io', // Plausible Analytics
            'https://*.plausible.io', // Plausible Analytics subdomains
          ],
          frameSrc: [
            "'self'",
            'https://*.supabase.co',
          ],
          mediaSrc: [
            "'self'",
            'blob:',
          ],
        }
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
    })
  : helmet({
      // Development: More permissive CSP
      contentSecurityPolicy: false, // Disable in dev to avoid issues with HMR
    });

/**
 * Rate Limiting Configuration
 * Per-route rate limits for different endpoint types
 */
const rateLimitConfig: Record<string, { windowMs: number; max: number }> = {
  // Authentication endpoints - strict limits
  '/api/auth/login': RATE_LIMITS.AUTH_LOGIN,
  '/api/auth/register': RATE_LIMITS.AUTH_REGISTER,
  '/api/auth/refresh': RATE_LIMITS.AUTH_REFRESH,
  '/api/auth/*': RATE_LIMITS.AUTH_DEFAULT,
  
  // Agent endpoints - moderate limits
  '/api/agents': RATE_LIMITS.AGENTS,
  '/api/dashboard': RATE_LIMITS.DASHBOARD,
  
  // ElevenLabs endpoints - strict limits to prevent cost overruns
  '/api/voice-agent/elevenlabs-stream-token': { windowMs: 3600000, max: 5 }, // 5 per hour
  '/api/agent/test-call': { windowMs: 86400000, max: 3 }, // 3 per day
  
  // Health and public endpoints - lenient limits
  '/api/health': RATE_LIMITS.HEALTH,
  '/health': RATE_LIMITS.HEALTH,
  
  // Default for all other API routes
  '/api/*': RATE_LIMITS.DEFAULT,
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
  return RATE_LIMITS.DEFAULT;
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
 * Per-route rate limiters cache - initialized at module load time
 */
const rateLimitersCache = new Map<string, ReturnType<typeof createRateLimiter>>();

/**
 * Initialize all rate limiters at module load time (app initialization)
 * This ensures rate limiters are created before any requests are handled
 */
function initializeRateLimiters() {
  // Get unique configs from rateLimitConfig
  const configs = new Set<string>();
  Object.values(rateLimitConfig).forEach(config => {
    const key = `${config.windowMs}-${config.max}`;
    configs.add(key);
  });
  
  // Also add default config
  const defaultConfig = RATE_LIMITS.DEFAULT;
  const defaultKey = `${defaultConfig.windowMs}-${defaultConfig.max}`;
  configs.add(defaultKey);
  
  // Create rate limiters for all configs
  configs.forEach(key => {
    const [windowMs, max] = key.split('-').map(Number);
    if (!rateLimitersCache.has(key)) {
      rateLimitersCache.set(key, createRateLimiter(windowMs, max));
    }
  });
}

/**
 * Get rate limiter for a path (must use pre-initialized limiters)
 */
function getRateLimiter(path: string) {
  const config = getRateLimitConfig(path);
  const key = `${config.windowMs}-${config.max}`;
  
  // Ensure limiter exists (should already be initialized, but double-check)
  if (!rateLimitersCache.has(key)) {
    rateLimitersCache.set(key, createRateLimiter(config.windowMs, config.max));
  }
  
  return rateLimitersCache.get(key)!;
}

// Initialize rate limiters immediately when module loads
initializeRateLimiters();

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
