# Error Handling Guide

This document outlines the standardized error handling patterns for the AIDevelo.ai codebase.

## Backend Error Handling

### Standard Pattern

All backend controllers should follow this pattern:

```typescript
import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors';
import { sendSuccess, sendFailure } from '../utils/apiResponse';

export const myController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate input
    const validated = schema.parse(req.body);
    
    // Business logic
    const result = await someService.doSomething(validated);
    
    // Success response
    return sendSuccess(res, result, 'Operation successful');
    
  } catch (error) {
    // Always pass errors to next() - error middleware will handle them
    return next(error);
  }
};
```

### Error Types

#### 1. Validation Errors
Use `ValidationError` for input validation failures:

```typescript
import { ValidationError } from '../utils/errors';
import { z } from 'zod';

try {
  const validated = schema.parse(req.body);
} catch (error) {
  if (error instanceof z.ZodError) {
    return next(new ValidationError('Validation failed', error.errors));
  }
  return next(error);
}
```

#### 2. Business Logic Errors
Use `AppError` for business logic failures:

```typescript
import { AppError } from '../utils/errors';

if (!user) {
  return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
}

if (!hasPermission) {
  return next(new AppError('Insufficient permissions', 403, 'FORBIDDEN'));
}
```

#### 3. Unexpected Errors
Let unexpected errors bubble up to error middleware:

```typescript
try {
  await someOperation();
} catch (error) {
  // If it's an expected error, convert it
  if (error instanceof KnownError) {
    return next(new AppError(error.message, 400));
  }
  // Otherwise, let it bubble up (will be caught by error middleware)
  return next(error);
}
```

### Error Middleware

The error middleware (`server/src/middleware/errorHandler.ts`) automatically:
- Converts errors to RFC 7807 Problem Details format
- Logs errors appropriately
- Handles CORS errors
- Provides debug information in development mode

### Response Format

All error responses follow RFC 7807 Problem Details format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "type": "https://aidevelo.ai/errors/validation",
      "status": 422,
      "validation-errors": [...]
    }
  },
  "meta": {
    "requestId": "req-1234567890-abc",
    "timestamp": "2025-01-27T10:00:00Z",
    "version": "abc123"
  }
}
```

## Frontend Error Handling

### Standard Pattern

All frontend API calls should use the `apiClient` which handles errors automatically:

```typescript
import { apiClient } from '@/services/apiClient';
import { logger } from '@/lib/logger';

try {
  const response = await apiClient.get('/endpoint');
  // Handle success
} catch (error) {
  // apiClient throws ApiRequestError for API errors
  if (error instanceof ApiRequestError) {
    logger.error('API request failed', error, {
      statusCode: error.statusCode,
      endpoint: '/endpoint'
    });
    // Show user-friendly error message
    toast.error(error.message);
  } else {
    // Unexpected error
    logger.error('Unexpected error', error);
    toast.error('An unexpected error occurred');
  }
}
```

### Error Logging

Always use the logger utility instead of console.log:

```typescript
import { logger } from '@/lib/logger';

// Debug (only in development)
logger.debug('Debug message', { data });

// Info (only in development)
logger.info('Info message', { data });

// Warning (always logged)
logger.warn('Warning message', { data });

// Error (always logged)
logger.error('Error message', error, { context });
```

### User-Facing Errors

Show user-friendly error messages:

```typescript
import { toast } from '@/components/ui/Toast';

try {
  await apiClient.post('/endpoint', data);
  toast.success('Operation successful');
} catch (error) {
  if (error instanceof ApiRequestError) {
    // Extract user-friendly message
    const message = error.details?.message || error.message || 'An error occurred';
    toast.error(message);
  } else {
    toast.error('An unexpected error occurred. Please try again.');
  }
}
```

## Best Practices

### DO ✅

- Always use `next(error)` in Express controllers
- Use appropriate error types (`AppError`, `ValidationError`)
- Log errors with context using the logger
- Show user-friendly error messages
- Handle errors at the appropriate level (controller vs service)

### DON'T ❌

- Don't return error responses directly from controllers
- Don't use `console.log/error` in production code
- Don't expose internal error details to users
- Don't swallow errors silently
- Don't use generic error messages without context

## Examples

### Backend Example

```typescript
export const createAgent = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate input
    const validated = CreateAgentSchema.parse(req.body);
    
    // Check permissions
    if (!req.supabaseUser) {
      return next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
    }
    
    // Business logic
    const agent = await agentService.create(validated, req.supabaseUser.supabaseUserId);
    
    // Success
    return sendSuccess(res, agent, 'Agent created successfully');
    
  } catch (error) {
    // Let error middleware handle it
    return next(error);
  }
};
```

### Frontend Example

```typescript
const handleCreateAgent = async (data: AgentFormData) => {
  try {
    setIsLoading(true);
    const response = await apiClient.post('/agents', data);
    logger.info('Agent created successfully', { agentId: response.data.id });
    toast.success('Agent created successfully');
    navigate('/dashboard');
  } catch (error) {
    logger.error('Failed to create agent', error);
    
    if (error instanceof ApiRequestError) {
      if (error.statusCode === 422) {
        // Validation errors
        const validationErrors = error.details?.['validation-errors'];
        if (validationErrors) {
          toast.error(`Validation failed: ${validationErrors.map((e: any) => e.message).join(', ')}`);
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error(error.message || 'Failed to create agent');
      }
    } else {
      toast.error('An unexpected error occurred');
    }
  } finally {
    setIsLoading(false);
  }
};
```

## Migration Checklist

When updating existing code:

- [ ] Replace `console.log/error/warn` with `logger.debug/info/warn/error`
- [ ] Ensure controllers use `next(error)` instead of direct error responses
- [ ] Use appropriate error types (`AppError`, `ValidationError`)
- [ ] Add context to error logs
- [ ] Show user-friendly error messages
- [ ] Test error scenarios

