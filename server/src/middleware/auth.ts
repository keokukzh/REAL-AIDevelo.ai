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

    // #region agent log
    const fs = require('fs');
    fs.appendFileSync('c:\\Users\\Aidevelo\\Desktop\\REAL-AIDevelo.ai\\.cursor\\debug.log', JSON.stringify({location:'auth.ts:15',message:'requireAuth middleware entry',data:{hasHeader:!!header,headerLength:header.length,hasToken:!!token,tokenLength:token.length,path:req.path,method:req.method},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'}) + '\n');
    // #endregion

    if (!token) {
      return next(new UnauthorizedError('Authentication required'));
    }

    const decoded = verifyAccessToken(token);
    req.auth = decoded;
    next();
  } catch (error) {
    // #region agent log
    const fs = require('fs');
    fs.appendFileSync('c:\\Users\\Aidevelo\\Desktop\\REAL-AIDevelo.ai\\.cursor\\debug.log', JSON.stringify({location:'auth.ts:24',message:'requireAuth token verification failed',data:{error:(error as Error).message,path:req.path},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'}) + '\n');
    // #endregion
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

