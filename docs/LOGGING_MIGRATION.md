# Logging Migration Guide

This guide documents the migration from `console.log` statements to the new environment-based logging utility.

## New Logging Utility

Location: `src/lib/logger.ts`

### Features

- Environment-based logging (only logs in development by default)
- Structured logging with context
- Automatic error handling
- Production-safe (only warnings and errors in production)

### Usage

```typescript
import { logger } from '@/lib/logger';

// Debug (only in development)
logger.debug('Debug message', { data: 'value' });

// Info (only in development)
logger.info('Info message', { userId: '123' });

// Warning (always logged)
logger.warn('Warning message', { issue: 'description' });

// Error (always logged)
logger.error('Error message', error, { context: 'additional info' });
```

## Migration Checklist

### Files Migrated ✅

- [x] `src/services/apiClient.ts`
- [x] `src/pages/OnboardingPage.tsx`
- [x] `src/components/VoiceOnboarding.tsx` (partial)

### Files Remaining

The following files still contain `console.log/error/warn` statements and should be migrated:

- `src/hooks/useElevenLabsStreaming.ts`
- `src/components/dashboard/PhoneConnectionModal.tsx`
- `src/components/dashboard/WebhookStatusModal.tsx`
- `src/lib/supabase.ts`
- `src/pages/AuthCallbackPage.tsx`
- `src/components/hero/HeroPhone.tsx`
- `src/pages/VoiceEditPage.tsx`
- `src/components/DemoSection.tsx`
- `src/components/CalendarIntegration.tsx`
- `src/hooks/useScheduledReports.ts`
- `src/components/agent/AnalyticsTab.tsx`
- `src/components/dashboard/AvailabilityModal.tsx`
- `src/components/IndustryDemoPreview.tsx`
- `src/components/dashboard/VoiceAgentStreamingUI.tsx`
- `src/components/dashboard/SetupWizard.tsx`
- `src/hooks/useCallAnalytics.ts`
- `src/components/agent/RAGManagementTab.tsx`
- `src/pages/AnalyticsPage.tsx`
- `src/pages/AgentDetailsPage.tsx`
- `src/pages/LoginPage.tsx`
- `src/components/dashboard/AgentTestModal.tsx`
- `src/components/agent/CallHistoryTab.tsx`

## Migration Pattern

### Before

```typescript
console.log('[Component] Message', data);
console.error('[Component] Error:', error);
console.warn('[Component] Warning:', warning);
```

### After

```typescript
import { logger } from '@/lib/logger';

logger.debug('Message', { data });
logger.error('Error message', error, { context });
logger.warn('Warning message', { warning });
```

## Environment Variables

- `VITE_DEBUG_LOGS=true` - Enable debug logs in non-development environments
- Development mode (`import.meta.env.DEV`) - Logs everything
- Production mode (`import.meta.env.PROD`) - Only logs warnings and errors

## Benefits

1. **Performance**: No logging overhead in production
2. **Security**: Prevents information leakage
3. **Consistency**: Standardized logging format
4. **Debugging**: Better structured logs with context

