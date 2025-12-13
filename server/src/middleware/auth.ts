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
    } catch (e) {
      // Ignore logging errors - never crash on logging
    }
  }
};

export const requireAuth = (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  // Safe logging outside try/catch to prevent logging errors from affecting auth
  const header = req.headers.authorization || '';
  const token = header.replace(/Bearer\s+/i, '');
  safeLogAuth('requireAuth middleware entry', {
    hasHeader: !!header,
    headerLength: header.length,
    hasToken: !!token,
    tokenLength: token.length,
    path: req.path,
    method: req.method
  });

  try {
    if (!token) {
      return next(new UnauthorizedError('Authentication required'));
    }

    const decoded = verifyAccessToken(token);
    req.auth = decoded;
    next();
  } catch (error) {
    // Safe logging for auth errors
    safeLogAuth('requireAuth token verification failed', {
      error: (error as Error).message,
      path: req.path
    });
    // Only return 401 for actual auth errors, not logging errors
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

