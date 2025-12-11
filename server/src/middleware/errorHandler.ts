import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors';
import { config } from '../config/env';
import { sendFailure } from '../utils/apiResponse';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Always log errors for debugging
  console.error('[ErrorHandler] Error caught', {
    message: err.message,
    name: err.name,
    statusCode: err instanceof AppError ? err.statusCode : 500,
    path: req.path,
    method: req.method,
    origin: req.headers.origin,
    stack: err.stack
  });
  
  // Handle CORS errors specifically
  if (err.message && err.message.includes('CORS')) {
    console.warn('[CORS Error]', {
      message: err.message,
      origin: req.headers.origin,
      path: req.path,
      method: req.method
    });
    
    // For CORS errors, send proper response with CORS headers
    // This prevents 500 errors on OPTIONS requests
    if (req.method === 'OPTIONS') {
      return sendFailure(res, 403, 'CORS policy violation', err.message);
    }

    return sendFailure(res, 403, 'CORS policy violation', err.message);
  }

  // Handle known operational errors
  if (err instanceof AppError && err.isOperational) {
    const payload: any = {
      error: err.message,
    };
    if ('details' in err && (err as any).details) payload.details = (err as any).details;
    if ((err as any).code) payload.code = (err as any).code;

    return sendFailure(res, err.statusCode, err.message, payload.details);
  }

  // Handle unknown/unexpected errors
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = config.isProduction
    ? 'Internal Server Error'
    : err.message || 'Internal Server Error';

  const details: any = {};
  if ((err as any).code) details.code = (err as any).code;
  if (!config.isProduction) details.stack = err.stack;

  sendFailure(res, statusCode, message, Object.keys(details).length ? details : undefined);
};
