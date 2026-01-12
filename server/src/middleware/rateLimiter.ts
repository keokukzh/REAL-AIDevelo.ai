import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { config } from '../config/env';

/**
 * AIDevelo Rate Limiting Configuration
 * Provides different levels of protection for various API endpoints.
 */

// Basis Rate Limiter for all common endpoints
export const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // Default 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // Default 100 requests per IP
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    console.log(`[RATE LIMIT] General - IP: ${req.ip}, Path: ${req.path}`);
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please slow down.',
      retryAfter: (req as any).rateLimit?.resetTime,
    });
  },
});

// Strict Rate Limiting for Authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '10'), // Default 10 login attempts
  skipSuccessfulRequests: true, // Successful requests don't count towards the limit
  message: {
    error: 'Too many authentication attempts',
    retryAfter: '15 minutes',
  },
  handler: (req: Request, res: Response) => {
    console.log(`[RATE LIMIT] Auth - IP: ${req.ip}, Path: ${req.path}`);
    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'Too many requests. Please try again after 15 minutes.',
      retryAfter: (req as any).rateLimit?.resetTime,
    });
  },
});

// API Key / Voice Agent Rate Limiter
export const voiceAgentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.VOICE_AGENT_RATE_LIMIT_MAX || '50'), // Max 50 calls per minute
  message: {
    error: 'Voice agent rate limit exceeded',
    retryAfter: '1 minute',
  },
  handler: (req: Request, res: Response) => {
    console.log(`[RATE LIMIT] Voice Agent - IP: ${req.ip}, Path: ${req.path}`);
    res.status(429).json({
      error: 'Voice agent rate limit exceeded',
      message: 'Too many voice agent requests. Please slow down.',
      retryAfter: (req as any).rateLimit?.resetTime,
    });
  },
});

// Webhook Rate Limiter (more generous for external services)
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // Max 200 Webhooks per minute
  skipFailedRequests: true,
  message: {
    error: 'Webhook rate limit exceeded',
  },
  handler: (req: Request, res: Response) => {
    console.log(`[RATE LIMIT] Webhook - IP: ${req.ip}, Path: ${req.path}`);
    res.status(429).json({
      error: 'Webhook rate limit exceeded',
    });
  },
});

// Public Endpoint Limiter
export const publicLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // Max 200 requests per minute
  message: {
    error: 'Public endpoint rate limit exceeded',
  },
  handler: (req: Request, res: Response) => {
    console.log(`[RATE LIMIT] Public - IP: ${req.ip}, Path: ${req.path}`);
    res.status(429).json({
      error: 'Public endpoint rate limit exceeded',
    });
  },
});
