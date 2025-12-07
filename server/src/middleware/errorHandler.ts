import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors';
import { config } from '../config/env';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error (in production, use proper logging service)
  if (!config.isProduction) {
    console.error('[ErrorHandler]', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method
    });
  }

  // Handle known operational errors
  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(err instanceof ValidationError && 'details' in err && err.details
        ? { details: err.details }
        : {})
    });
  }

  // Handle unknown/unexpected errors
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = config.isProduction
    ? 'Internal Server Error'
    : err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(config.isProduction ? {} : { stack: err.stack })
  });
};
