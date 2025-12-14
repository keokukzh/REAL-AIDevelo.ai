import { Response, Request } from 'express';

// Ensure CORS headers are always set
const setCorsHeaders = (res: Response) => {
  const origin = res.req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
};

// Get backend version from environment
const getBackendVersion = (): string => {
  return process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || '1.0.0';
};

// Generate or retrieve request ID
const getRequestId = (req: Request): string => {
  return (req.headers['x-request-id'] as string) || 
    `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

// Standard API response interface
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    requestId: string;
    timestamp: string;
    version: string;
  };
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  status = 200
): Response => {
  setCorsHeaders(res);
  const req = res.req as Request;
  const requestId = getRequestId(req);
  const timestamp = new Date().toISOString();
  const version = getBackendVersion();

  // Set response headers
  res.setHeader('x-aidevelo-request-id', requestId);
  res.setHeader('x-aidevelo-backend-sha', version);
  res.setHeader('x-api-version', version);

  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      requestId,
      timestamp,
      version,
    },
  };

  if (message) {
    (response as any).message = message;
  }

  return res.status(status).json(response);
};

export const sendFailure = (
  res: Response,
  status: number,
  error: string,
  details?: unknown,
  errorCode?: string
): Response => {
  setCorsHeaders(res);
  const req = res.req as Request;
  const requestId = getRequestId(req);
  const timestamp = new Date().toISOString();
  const version = getBackendVersion();

  // Set response headers
  res.setHeader('x-aidevelo-request-id', requestId);
  res.setHeader('x-aidevelo-backend-sha', version);
  res.setHeader('x-api-version', version);

  console.error('[API Response] Failure:', {
    status,
    error,
    errorCode,
    path: req.path,
    method: req.method,
    requestId,
  });

  const response: ApiResponse = {
    success: false,
    error: {
      code: errorCode || getDefaultErrorCode(status),
      message: error,
      ...(details ? { details } : {}),
    },
    meta: {
      requestId,
      timestamp,
      version,
    },
  };

  return res.status(status).json(response);
};

// Map HTTP status codes to error codes
function getDefaultErrorCode(status: number): string {
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

