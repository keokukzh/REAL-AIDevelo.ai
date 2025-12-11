import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { ValidationError } from '../utils/errors';

/**
 * Middleware to validate request body against a Zod schema
 */
export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[Validation] Validating request', {
        path: req.path,
        method: req.method,
        bodyKeys: Object.keys(req.body || {}),
        hasBusinessProfile: !!req.body?.businessProfile,
        hasConfig: !!req.body?.config
      });
      
      const validated = schema.parse(req.body);
      // Replace req.body with validated data (strips unknown fields)
      req.body = validated;
      
      console.log('[Validation] Validation passed', {
        path: req.path,
        validatedKeys: Object.keys(validated)
      });
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('[Validation] Validation failed', {
          path: req.path,
          errors: error.errors,
          receivedBody: req.body
        });
        return next(new ValidationError('Validation failed', error.errors));
      }
      console.error('[Validation] Unexpected error', {
        path: req.path,
        error: (error as Error).message
      });
      next(error);
    }
  };
};

/**
 * Middleware to validate request params against a Zod schema
 */
export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new ValidationError('Invalid parameters', error.errors));
      }
      next(error);
    }
  };
};

