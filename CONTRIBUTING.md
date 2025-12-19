# Contributing to AIDevelo.ai

Thank you for your interest in contributing to AIDevelo.ai! This document provides guidelines and best practices for contributing to the project.

## Table of Contents

- [Code Style](#code-style)
- [Error Handling](#error-handling)
- [Logging Guidelines](#logging-guidelines)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Commit Message Format](#commit-message-format)

## Code Style

### TypeScript

- Use TypeScript strict mode
- Avoid `any` type - use `unknown` or proper types
- Use interfaces for object shapes
- Use `const` assertions for immutable data

### Naming Conventions

- **Files**: Use kebab-case for files (e.g., `error-handler.ts`)
- **Functions/Classes**: Use camelCase for functions, PascalCase for classes
- **Constants**: Use UPPER_SNAKE_CASE for constants (extracted to `constants.ts`)

### Code Organization

- **Backend**: Follow the pattern: routes → controllers → services → repositories
- **Frontend**: Organize by feature, use hooks for reusable logic
- **Separation of Concerns**: Keep business logic in services, not in controllers/components

## Error Handling

### Backend

**Always use the error middleware pattern:**

```typescript
// ✅ Good: Use next(error) with AppError
export const myController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // ... logic
    if (!resource) {
      return next(new NotFoundError('Resource not found'));
    }
    res.json({ success: true, data: resource });
  } catch (error) {
    next(error instanceof Error ? error : new InternalServerError(String(error)));
  }
};

// ❌ Bad: Direct response
return res.status(500).json({ error: 'Something went wrong' });
```

**Error Classes:**
- `AppError` - Base class for operational errors
- `ValidationError` - 422 validation failures (includes details)
- `BadRequestError` - 400 bad requests
- `UnauthorizedError` - 401 authentication failures
- `ForbiddenError` - 403 authorization failures
- `NotFoundError` - 404 resource not found
- `InternalServerError` - 500 unexpected errors

### Frontend

**Use the error handler hook:**

```typescript
import { useErrorHandler } from '@/hooks/useErrorHandler';

const MyComponent = () => {
  const { handleError, handleApiError } = useErrorHandler();
  
  const handleAction = async () => {
    try {
      await apiCall();
    } catch (error) {
      handleApiError(error, {
        showUserMessage: true,
        userMessage: 'Custom error message',
      });
    }
  };
};
```

## Logging Guidelines

### Backend

**Use StructuredLoggingService:**

```typescript
import { StructuredLoggingService } from '../services/loggingService';

// ✅ Good: Structured logging with context
StructuredLoggingService.error(
  'Operation failed',
  error,
  { userId, resourceId, step: 'validation' },
  req
);

// ❌ Bad: console.log in production
console.error('Error:', error);
```

**Log Levels:**
- `debug` - Detailed debugging information (dev only)
- `info` - General informational messages
- `warn` - Warning messages (non-critical issues)
- `error` - Error messages (include Error object)

### Frontend

**Use the logger utility:**

```typescript
import { logger } from '@/lib/logger';

// ✅ Good: Environment-aware logging
logger.error('Operation failed', error, { context });

// ❌ Bad: console.log in production
console.log('Debug info:', data);
```

**Log Levels:**
- `debug` - Only in development
- `info` - General information (dev only in production)
- `warn` - Warnings (always logged)
- `error` - Errors (always logged)

## Testing Requirements

### Test Coverage Target

- **Minimum**: 80% code coverage
- **Critical Paths**: 100% coverage (auth, payments, agent creation)

### Test Types

1. **Unit Tests** (`server/tests/unit/`)
   - Test individual functions/classes in isolation
   - Mock external dependencies
   - Use Vitest framework

2. **Integration Tests** (`server/tests/integration/`)
   - Test API endpoints end-to-end
   - Use test database
   - Test authentication flows

3. **E2E Tests** (`tests/e2e/`)
   - Test critical user flows
   - Use Playwright
   - Test: Login → Dashboard → Agent Creation → Test Call

### Running Tests

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# All tests
npm run test:all

# Coverage
npm run test:coverage
```

## Pull Request Process

1. **Create a feature branch** (if not working directly on main)
2. **Make small, focused changes** - one logical change per PR
3. **Run tests** - Ensure all tests pass
4. **Run typecheck** - `npm run typecheck` (if available)
5. **Update documentation** - If adding features, update relevant docs
6. **Write descriptive PR description** - Explain what and why

### PR Checklist

- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] No console.log statements (use structured logging)
- [ ] Error handling uses proper patterns
- [ ] No magic numbers (use constants)
- [ ] Documentation updated if needed

## Commit Message Format

Use clear, descriptive commit messages:

```
type: Short description (50 chars max)

Longer explanation if needed. Wrap at 72 characters.
Explain what and why, not how.

Fixes #123
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `docs`: Documentation changes
- `test`: Test additions/changes
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `style`: Code style changes (formatting)

**Examples:**
```
fix: Resolve race condition in user creation

Handle unique constraint violations when multiple requests
create the same user simultaneously.

Fixes #456
```

```
feat: Add retry logic for external API calls

Implement exponential backoff retry for ElevenLabs, Twilio,
and Google Calendar API calls to improve resilience.
```

## Constants and Configuration

**Extract magic numbers to constants:**

```typescript
// ✅ Good: Use constants
import { API_TIMEOUTS } from '../config/constants';
timeout: API_TIMEOUTS.ELEVENLABS

// ❌ Bad: Magic numbers
timeout: 30000
```

**Constants files:**
- Backend: `server/src/config/constants.ts`
- Frontend: `src/config/constants.ts`

## Security Guidelines

1. **Never log sensitive data** (passwords, tokens, PII)
2. **Validate all input** using Zod schemas
3. **Use parameterized queries** (never string concatenation)
4. **Check authentication** before accessing resources
5. **Sanitize error messages** in production

## Performance Guidelines

1. **Use Promise.all** for parallel independent queries
2. **Avoid N+1 query patterns** - use joins or parallel queries
3. **Cache expensive operations** - use cacheService for dashboard data
4. **Monitor slow queries** - queries > 1s are logged automatically

## Documentation

### JSDoc Comments

Add JSDoc to all public functions:

```typescript
/**
 * Creates a new agent configuration
 * @param locationId - The location ID to create agent for
 * @param config - Agent configuration options
 * @returns Promise resolving to created agent config
 * @throws {InternalServerError} If agent creation fails
 */
export async function createAgent(
  locationId: string,
  config: AgentConfig
): Promise<AgentConfig> {
  // ...
}
```

## Questions?

If you have questions about contributing, please:
1. Check existing documentation in `docs/`
2. Review similar code in the codebase
3. Ask in PR comments or issues

Thank you for contributing to AIDevelo.ai! 🚀
