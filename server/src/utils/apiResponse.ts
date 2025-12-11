import { Response } from 'express';

// Ensure CORS headers are always set
const setCorsHeaders = (res: Response) => {
  const origin = res.req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
};

export const sendSuccess = <T>(res: Response, data: T, message?: string, status = 200) => {
  setCorsHeaders(res);
  return res.status(status).json({
    success: true,
    data,
    ...(message ? { message } : {}),
  });
};

export const sendFailure = (res: Response, status: number, error: string, details?: unknown) => {
  setCorsHeaders(res);
  console.error('[API Response] Failure:', { status, error, path: res.req.path, method: res.req.method });
  return res.status(status).json({
    success: false,
    error,
    ...(details ? { details } : {}),
  });
};

