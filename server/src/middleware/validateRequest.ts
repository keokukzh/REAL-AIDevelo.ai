import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { ValidationError } from '../utils/errors';

/**
 * Middleware to validate request body against a Zod schema
 */
export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      // Replace req.body with validated data (strips unknown fields)
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new ValidationError('Validation failed', error.errors));
      }
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

