import { Response } from 'express';

export const sendSuccess = <T>(res: Response, data: T, message?: string, status = 200) => {
  return res.status(status).json({
    success: true,
    data,
    ...(message ? { message } : {}),
  });
};

export const sendFailure = (res: Response, status: number, error: string, details?: unknown) => {
  return res.status(status).json({
    success: false,
    error,
    ...(details ? { details } : {}),
  });
};

