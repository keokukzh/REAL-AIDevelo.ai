import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors';
import { config } from '../config/env';
import { sendFailure } from '../utils/apiResponse';

// Get backend version from environment
const getBackendVersion = (): string => {
  return process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || '1.0.0';
};

// RFC 7807 Problem Details type
interface ProblemDetails {
  type?: string; // URI reference identifying the problem type
  title: string; // Short, human-readable summary
  status: number; // HTTP status code
  detail?: string; // Human-readable explanation
  instance?: string; // URI reference identifying the specific occurrence
  [key: string]: unknown; // Extension members
}

// Map error to RFC 7807 Problem Details
function toProblemDetails(err: Error | AppError, req: Request, isDebugMode: boolean): ProblemDetails {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const baseUrl = config.publicBaseUrl || `http://${req.get('host')}`;
  
  // Determine error type URI
  let type = `${baseUrl}/errors/unknown`;
  if (err instanceof ValidationError) {
    type = `${baseUrl}/errors/validation`;
  } else if (err instanceof AppError) {
    const errorTypeMap: Record<number, string> = {
      400: 'bad-request',
      401: 'unauthorized',
      403: 'forbidden',
      404: 'not-found',
      409: 'conflict',
      422: 'validation-error',
      429: 'rate-limit-exceeded',
      500: 'internal-server-error',
      502: 'bad-gateway',
      503: 'service-unavailable',
      504: 'gateway-timeout',
    };
    type = `${baseUrl}/errors/${errorTypeMap[statusCode] || 'unknown'}`;
  }

  const problem: ProblemDetails = {
    type,
    title: err.name || 'Error',
    status: statusCode,
    detail: config.isProduction && !isDebugMode && statusCode >= 500
      ? 'An internal error occurred'
      : err.message,
    instance: req.originalUrl,
  };

  // Add error code if available
  if (err instanceof AppError && err.code) {
    problem['code'] = err.code;
  }

  // Add validation details for ValidationError
  if (err instanceof ValidationError && err.details) {
    problem['validation-errors'] = err.details;
  }

  // Add debug information in debug mode
  if (isDebugMode) {
    const debug: any = {};
    if (err.stack) {
      debug.stack = err.stack.split('\n').slice(0, 15).join('\n');
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

    if (Object.keys(debug).length > 0) {
      problem['debug'] = debug;
    }
  }

  return problem;
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Generate requestId if not present
  const requestId = (req.headers['x-request-id'] as string) || 
    `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  // Always set requestId header
  res.setHeader('x-aidevelo-request-id', requestId);
  res.setHeader('x-aidevelo-backend-sha', getBackendVersion());
  res.setHeader('Content-Type', 'application/problem+json'); // RFC 7807 content type

  // Always log errors for debugging (STRICT: first 15 lines of stack)
  const stackLines = err.stack ? err.stack.split('\n').slice(0, 15).join('\n') : 'No stack';
  
  // Extract user context if available
  const userContext: any = {};
  if ((req as any).auth) {
    userContext.userId = (req as any).auth.userId;
    userContext.orgId = (req as any).auth.orgId;
  }

  console.error('[ErrorHandler] Error caught', {
    requestId,
    method: req.method,
    path: req.path,
    name: err.name,
    message: err.message,
    statusCode: err instanceof AppError ? err.statusCode : 500,
    origin: req.headers.origin,
    ...userContext,
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
    const errorCode = 'CORS_POLICY_VIOLATION';
    return sendFailure(res, 403, 'CORS policy violation', err.message, errorCode);
  }

  // Check for gated debug mode (header-based)
  const debugHeader = req.headers['x-aidevelo-debug'] as string;
  const toolSecret = process.env.TOOL_SHARED_SECRET;
  const isHeaderDebugMode = debugHeader && toolSecret && debugHeader === toolSecret;

  // Check for DEBUG_ERRORS environment variable
  const isEnvDebugMode = process.env.DEBUG_ERRORS === 'true';

  // Debug mode is active if either header-based or env-based
  const isDebugMode = isHeaderDebugMode || isEnvDebugMode;

  // Handle known operational errors
  if (err instanceof AppError && err.isOperational) {
    const problem = toProblemDetails(err, req, isDebugMode);
    const errorCode = err.code || getErrorCodeFromStatus(err.statusCode);
    
    // For validation errors, include validation details
    const details = err instanceof ValidationError && err.details
      ? { ...problem, 'validation-errors': err.details }
      : problem;

    return sendFailure(res, err.statusCode, err.message, details, errorCode);
  }

  // Handle unknown/unexpected errors
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = config.isProduction && !isDebugMode && statusCode >= 500
    ? 'Internal Server Error'
    : err.message || 'Internal Server Error';

  const problem = toProblemDetails(err, req, isDebugMode);
  const errorCode = (err as any).code || getErrorCodeFromStatus(statusCode);

  return sendFailure(res, statusCode, message, problem, errorCode);
};

// Map HTTP status codes to error codes
function getErrorCodeFromStatus(status: number): string {
  const errorCodeMap: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'VALIDATION_ERROR',
    429: 'RATE_LIMIT_EXCEEDED',
    500: 'INTERNAL_SERVER_ERROR',
    502: 'BAD_GATEWAY',
    503: 'SERVICE_UNAVAILABLE',
    504: 'GATEWAY_TIMEOUT',
  };

  return errorCodeMap[status] || 'UNKNOWN_ERROR';
}
