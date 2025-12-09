import { Request, Response, NextFunction } from 'express';

const API_VERSION = 'v1';

export function attachApiVersionHeader(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-API-Version', API_VERSION);
  next();
}

// Middleware to warn about using non-versioned /api endpoints
export function deprecationWarningMiddleware(req: Request, res: Response, next: NextFunction) {
  // If request is not already versioned (i.e., path does not contain /api/v1), add a warning
  if (!req.originalUrl.includes('/api/v1')) {
    // RFC 7234 style warning header
    res.setHeader('Warning', '199 - "Deprecated API: prefer /api/v1"');
  }
  next();
}

export default API_VERSION;
