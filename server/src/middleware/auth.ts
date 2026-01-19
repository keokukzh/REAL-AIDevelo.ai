import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../services/authService';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { AuthenticatedRequest as AuthPayload } from '../shared/types/auth';

export interface AuthenticatedRequest extends Request {
  auth?: AuthPayload;
}

// Safe logging helper - never throws, only logs in development
const safeLogAuth = (message: string, data: any) => {
  if (process.env.NODE_ENV !== 'production') {
    try {
      console.log(`[Auth] ${message}`, data);
    } catch {
      // Ignore logging errors - never crash on logging
    }
  }
};

export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Safe logging outside try/catch to prevent logging errors from affecting auth
  const header = req.headers.authorization || '';
  const token = header.replace(/Bearer\s+/i, '');
  safeLogAuth('requireAuth middleware entry', {
    hasHeader: !!header,
    headerLength: header.length,
    hasToken: !!token,
    tokenLength: token.length,
    path: req.path,
    method: req.method,
  });

  try {
    if (!token) {
      return next(new UnauthorizedError('Authentication required'));
    }

    // 1. Try Legacy JWT Auth
    try {
      const decoded = verifyAccessToken(token);
      req.auth = decoded;
      return next();
    } catch {
      // 2. Fallback to Supabase Auth
      const { verifySupabaseAuth } = await import('./supabaseAuth');

      // We wrap verifySupabaseAuth to capture its result
      // But verifySupabaseAuth is designed to call next() or send a response
      // For this unified middleware, we'll try to use a more direct approach if possible,
      // but verifySupabaseAuth already does everything we need.
      // However, it might set req.supabaseUser instead of req.auth.

      return verifySupabaseAuth(req as any, res, () => {
        // If Supabase auth succeeded, map it to req.auth for legacy compatibility
        if ((req as any).supabaseUser) {
          req.auth = {
            userId: (req as any).supabaseUser.id,
            email: (req as any).supabaseUser.email,
            role: 'user', // Default role for Supabase users
          };
          return next();
        }
        next(new UnauthorizedError('Invalid or expired token'));
      });
    }
  } catch (error) {
    // Safe logging for auth errors
    safeLogAuth('requireAuth failed', {
      error: (error as Error).message,
      path: req.path,
    });
    return next(new UnauthorizedError('Invalid or expired token'));
  }
};

export const authorize =
  (...roles: Array<'admin' | 'user'>) =>
  (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (roles.length && (!req.auth.role || !roles.includes(req.auth.role))) {
      return next(new ForbiddenError('Insufficient permissions'));
    }

    next();
  };
