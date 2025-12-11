import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../services/authService';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { AuthenticatedRequest as AuthPayload } from '../../shared/types/auth';

export interface AuthenticatedRequest extends Request {
  auth?: AuthPayload;
}

export const requireAuth = (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.replace(/Bearer\s+/i, '');

    if (!token) {
      return next(new UnauthorizedError('Authentication required'));
    }

    const decoded = verifyAccessToken(token);
    req.auth = decoded;
    next();
  } catch (error) {
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

