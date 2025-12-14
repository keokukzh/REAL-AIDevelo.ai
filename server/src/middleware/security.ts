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
 * Rate Limiting
 */
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Apply rate limiting to API routes (except health check and OPTIONS preflight)
 */
export const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Skip rate limiting for OPTIONS (CORS preflight) and health checks
  if (req.method === 'OPTIONS' || req.path === '/health') {
    return next();
  }
  if (req.path.startsWith('/api/') && req.path !== '/api') {
    return rateLimiter(req, res, next);
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
