import { describe, it, expect } from 'vitest';
import {
  AppError,
  ValidationError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  InternalServerError,
} from '../errors';

describe('Error classes', () => {
  describe('AppError', () => {
    it('should create error with status code and message', () => {
      const error = new AppError(400, 'Bad request');
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Bad request');
      expect(error.isOperational).toBe(true);
    });

    it('should have stack trace', () => {
      const error = new AppError(500, 'Server error');
      expect(error.stack).toBeDefined();
    });
  });

  describe('ValidationError', () => {
    it('should have 422 status code', () => {
      const error = new ValidationError('Invalid input');
      expect(error.statusCode).toBe(422);
      expect(error.message).toBe('Invalid input');
    });

    it('should accept validation details', () => {
      const details = { field: 'email', message: 'Invalid email format' };
      const error = new ValidationError('Validation failed', details);
      expect(error.details).toEqual(details);
    });
  });

  describe('BadRequestError', () => {
    it('should have 400 status code', () => {
      const error = new BadRequestError('Bad request');
      expect(error.statusCode).toBe(400);
    });
  });

  describe('UnauthorizedError', () => {
    it('should have 401 status code', () => {
      const error = new UnauthorizedError('Unauthorized');
      expect(error.statusCode).toBe(401);
    });
  });

  describe('ForbiddenError', () => {
    it('should have 403 status code', () => {
      const error = new ForbiddenError('Forbidden');
      expect(error.statusCode).toBe(403);
    });
  });

  describe('NotFoundError', () => {
    it('should have 404 status code', () => {
      const error = new NotFoundError('Not found');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('InternalServerError', () => {
    it('should have 500 status code', () => {
      const error = new InternalServerError('Internal error');
      expect(error.statusCode).toBe(500);
    });
  });
});
