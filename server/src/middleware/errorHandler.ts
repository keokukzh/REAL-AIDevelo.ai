import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors';
import { config } from '../config/env';
import { sendFailure } from '../utils/apiResponse';

// Get backend version from environment
const getBackendVersion = (): string => {
  return process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || 'unknown';
};

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Generate requestId if not present
  const requestId = (req.headers['x-request-id'] as string) || 
    `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Always set requestId header
  res.setHeader('x-aidevelo-request-id', requestId);
  res.setHeader('x-aidevelo-backend-sha', getBackendVersion());

  // Always log errors for debugging (STRICT: first 15 lines of stack)
  const stackLines = err.stack ? err.stack.split('\n').slice(0, 15).join('\n') : 'No stack';
  console.error('[ErrorHandler] Error caught', {
    requestId,
    method: req.method,
    path: req.path,
    name: err.name,
    message: err.message,
    statusCode: err instanceof AppError ? err.statusCode : 500,
    origin: req.headers.origin,
    stack: stackLines,
  });
  
  // Handle CORS errors specifically
  if (err.message && err.message.includes('CORS')) {
    console.warn('[CORS Error]', {
      requestId,
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
      requestId,
    };
    if ('details' in err && (err as any).details) payload.details = (err as any).details;
    if ((err as any).code) payload.code = (err as any).code;

    return sendFailure(res, err.statusCode, err.message, payload.details);
  }

  // Check for gated debug mode
  const debugHeader = req.headers['x-aidevelo-debug'] as string;
  const toolSecret = process.env.TOOL_SHARED_SECRET;
  const isDebugMode = debugHeader && toolSecret && debugHeader === toolSecret;

  // Handle unknown/unexpected errors
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = config.isProduction && !isDebugMode
    ? 'Internal Server Error'
    : err.message || 'Internal Server Error';

  // Build debug object if in debug mode
  const debug: any = {};
  if (isDebugMode) {
    debug.message = err.message;
    debug.name = err.name;
    // Only include first 10 lines of stack to avoid huge responses
    if (err.stack) {
      const stackLines = err.stack.split('\n');
      debug.stack = stackLines.slice(0, 10).join('\n');
    }
    
    // Extract Supabase error details if present
    if ((err as any).supabase) {
      debug.supabase = {
        code: (err as any).supabase.code,
        message: (err as any).supabase.message,
        details: (err as any).supabase.details,
        hint: (err as any).supabase.hint,
      };
    }
    
    // Extract validation errors if present
    if ((err as any).validationError) {
      debug.validationError = (err as any).validationError;
    }
    
    // Extract step if present
    if ((err as any).step) {
      debug.step = (err as any).step;
    }
    
    // Extract cause if present
    if ((err as any).cause) {
      debug.cause = (err as any).cause instanceof Error 
        ? { message: (err as any).cause.message, name: (err as any).cause.name }
        : (err as any).cause;
    }
  }

  const details: any = {
    requestId,
    backendSha: getBackendVersion(),
  };
  
  if ((err as any).code) details.code = (err as any).code;
  if (!config.isProduction) details.stack = err.stack;
  if (isDebugMode && Object.keys(debug).length > 0) {
    details.debug = debug;
  }

  sendFailure(res, statusCode, message, Object.keys(details).length ? details : undefined);
};
