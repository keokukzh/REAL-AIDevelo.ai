import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to attach the backend git commit SHA to every response.
 * This helps in debugging and identifying the version of the backend running.
 */
export function attachBackendSha(req: Request, res: Response, next: NextFunction) {
  const sha = process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || 'dev';
  res.setHeader('x-aidevelo-backend-sha', sha);
  next();
}
