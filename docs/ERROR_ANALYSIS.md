# Error Detective Analysis Report

**Generated:** 2025-01-27  
**Codebase:** AIDevelo.ai  
**Focus:** Log analysis, error pattern detection, and system anomaly identification

---

## Executive Summary

This document provides comprehensive error analysis, log parsing patterns, and error correlation strategies for the AIDevelo.ai codebase. It identifies common error patterns, provides regex patterns for log extraction, and offers monitoring queries for production error detection.

---

## 1. Current Error Handling Infrastructure

### 1.1 Error Handling Architecture

**Error Handler Location:** `server/src/middleware/errorHandler.ts`

**Key Features:**
- RFC 7807 Problem Details format
- Request ID correlation (`x-aidevelo-request-id`)
- Debug mode (header-based: `x-aidevelo-debug` or env: `DEBUG_ERRORS=true`)
- Stack trace truncation (first 15 lines)
- CORS error special handling
- User context extraction (userId, orgId)

**Error Classes:** `server/src/utils/errors.ts`
- `AppError` - Base operational error
- `ValidationError` - 422 validation failures
- `BadRequestError` - 400 bad requests
- `NotFoundError` - 404 resource not found
- `UnauthorizedError` - 401 authentication failures
- `ForbiddenError` - 403 authorization failures
- `InternalServerError` - 500 unexpected errors

### 1.2 Logging Services

**Structured Logging:** `server/src/services/loggingService.ts`
- JSON-formatted logs
- Request correlation via requestId
- Context extraction (userId, orgId, locationId, method, path, IP, userAgent)
- Error stack trace capture (first 10 lines)
- Log levels: debug, info, warn, error

**Audit Logging:** `server/src/services/auditService.ts`
- User action tracking
- Compliance logging
- Database persistence

**Call Logging:** `server/src/services/loggingService.ts` (CallLoggingService)
- Call metrics tracking
- Status tracking (initiated, connected, failed, completed)

---

## 2. Error Pattern Detection

### 2.1 Common Error Patterns

#### Pattern 1: Database Connection Errors
**Frequency:** High  
**Location:** `server/src/services/database.ts`, `server/src/app.ts`

**Error Signatures:**
```
[Database] ❌ Connection test failed
[Database] ❌ Invalid DATABASE_URL format
ENOTFOUND
ECONNREFUSED
Connection terminated unexpectedly
```

**Regex Pattern:**
```regex
\[Database\].*❌|ENOTFOUND|ECONNREFUSED|Connection.*terminated|DATABASE_URL.*invalid
```

**Root Causes:**
- Invalid DATABASE_URL format
- Network connectivity issues
- Supabase project inactive
- Firewall blocking connections

**Correlation:** Check `DATABASE_URL` env var, Supabase dashboard, network logs

---

#### Pattern 2: Authentication Errors (401)
**Frequency:** High  
**Location:** `server/src/middleware/auth.ts`, `server/src/middleware/supabaseAuth.ts`

**Error Signatures:**
```
UNAUTHORIZED
401.*Unauthorized
Invalid.*token
Session.*expired
```

**Regex Pattern:**
```regex
(UNAUTHORIZED|401|Invalid.*token|Session.*expired|Unauthorized)
```

**Root Causes:**
- Missing Authorization header
- Expired Supabase session
- Invalid JWT token
- Race condition: API call before session confirmed

**Correlation:** Check frontend session state, token expiry, request timing

**Known Issue:** Race condition in `useDashboardOverview` hook (documented in `docs/AUTH_500_FIX_PROOF.md`)

---

#### Pattern 3: CORS Policy Violations
**Frequency:** Medium  
**Location:** `server/src/middleware/security.ts`, `server/src/middleware/errorHandler.ts`

**Error Signatures:**
```
[CORS Error]
CORS.*policy.*violation
CORS_POLICY_VIOLATION
Rejected origin
```

**Regex Pattern:**
```regex
\[CORS.*Error\]|CORS.*policy.*violation|CORS_POLICY_VIOLATION|Rejected origin
```

**Root Causes:**
- Origin not in ALLOWED_ORIGINS
- Missing CORS headers on OPTIONS requests
- SSL termination stripping headers

**Correlation:** Check request origin header, CORS middleware config, SSL proxy config

---

#### Pattern 4: Validation Errors (422)
**Frequency:** Medium  
**Location:** `server/src/middleware/validateRequest.ts`, various controllers

**Error Signatures:**
```
VALIDATION_ERROR
422.*Validation.*failed
[Validation] Validation failed
ZodError
```

**Regex Pattern:**
```regex
VALIDATION_ERROR|422.*Validation|\[Validation\].*failed|ZodError
```

**Root Causes:**
- Invalid request body schema
- Missing required fields
- Type mismatches
- Zod schema validation failures

**Correlation:** Check request payload, Zod schema definitions, API documentation

---

#### Pattern 5: Race Condition Errors (500)
**Frequency:** Medium  
**Location:** `server/src/services/supabaseDb.ts`, `server/src/controllers/defaultAgentController.ts`

**Error Signatures:**
```
unique constraint violation
23505.*duplicate key
ensureUserRow.*failed
ensureOrgForUser.*failed
```

**Regex Pattern:**
```regex
(unique constraint|23505|duplicate key|ensureUserRow.*failed|ensureOrgForUser.*failed)
```

**Root Causes:**
- Multiple simultaneous requests creating same resource
- PostgreSQL unique constraint violations
- Missing idempotency handling

**Correlation:** Check request timing, concurrent user registrations, database transaction logs

**Known Fix:** Race condition handling added in `supabaseDb.ts` (documented in `docs/AUTH_500_FIX_PROOF.md`)

---

#### Pattern 6: External Service Errors
**Frequency:** Medium  
**Locations:** 
- `server/src/services/elevenLabsService.ts` (ElevenLabs API)
- `server/src/services/calendarService.ts` (Google Calendar)
- `server/src/services/twilioService.ts` (Twilio)

**Error Signatures:**
```
[ElevenLabs].*Error
[CalendarService].*Error
[TwilioService].*Error
API.*key.*invalid
Rate limit exceeded
```

**Regex Pattern:**
```regex
\[(ElevenLabs|CalendarService|TwilioService)\].*Error|API.*key.*invalid|Rate limit exceeded|502|503|504
```

**Root Causes:**
- Invalid API keys
- Rate limiting
- Service downtime
- Network timeouts

**Correlation:** Check API key validity, service status pages, rate limit headers

---

#### Pattern 7: Supabase Client Errors
**Frequency:** Medium  
**Location:** `server/src/services/supabaseDb.ts`, various controllers

**Error Signatures:**
```
Supabase.*error
Invalid API key
PGRST.*error
PostgREST.*error
```

**Regex Pattern:**
```regex
Supabase.*error|Invalid.*API.*key|PGRST|PostgREST
```

**Root Causes:**
- Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY
- Invalid Supabase credentials
- RLS policy blocking access
- Database connection issues

**Correlation:** Check Supabase env vars, RLS policies, Supabase dashboard logs

---

### 2.2 Error Rate Patterns

**High-Volume Error Endpoints:**
1. `/api/dashboard/overview` - Dashboard loading errors
2. `/api/auth/*` - Authentication flow errors
3. `/api/agent/default` - Agent creation/retrieval errors
4. `/api/calendar/*` - Calendar integration errors

**Time-Based Patterns:**
- **Peak Error Times:** User registration/login spikes
- **Sustained Errors:** Database connection issues
- **Spike Patterns:** Race conditions during concurrent requests

---

## 3. Log Extraction Regex Patterns

### 3.1 Error Log Extraction

**Extract all errors:**
```regex
\[ErrorHandler\]|\[.*Error\]|ERROR|error|❌
```

**Extract by severity:**
```regex
# Critical errors
\[.*\]\s*❌|FATAL|CRITICAL

# Warnings
\[.*\]\s*⚠️|WARN|warning

# Info logs
\[.*\]\s*ℹ️|INFO|info
```

**Extract by component:**
```regex
# Database errors
\[Database\].*❌

# Authentication errors
\[.*Auth.*\].*Error|UNAUTHORIZED|401

# Calendar errors
\[Calendar.*\].*Error

# Twilio errors
\[Twilio.*\].*Error

# ElevenLabs errors
\[ElevenLabs\].*Error
```

### 3.2 Request Correlation

**Extract request IDs:**
```regex
requestId[:\s]+(req-\d+-\w+)|x-aidevelo-request-id[:\s]+(req-\d+-\w+)
```

**Extract user context:**
```regex
userId[:\s]+([a-f0-9-]+)|orgId[:\s]+([a-f0-9-]+)|locationId[:\s]+([a-f0-9-]+)
```

**Extract error context:**
```regex
step[:\s]+(\w+)|path[:\s]+([^\s]+)|method[:\s]+(GET|POST|PUT|DELETE|PATCH)
```

### 3.3 Stack Trace Extraction

**Extract stack traces:**
```regex
stack[:\s]+(.*?)(?=\n\n|\n\[|\Z)
```

**Extract error messages:**
```regex
message[:\s]+([^\n]+)|Error[:\s]+([^\n]+)
```

---

## 4. Error Correlation Strategies

### 4.1 Temporal Correlation

**Pattern:** Errors occurring within short time windows may be related

**Query Strategy:**
```sql
-- Find errors within 5-minute windows
SELECT 
  DATE_TRUNC('minute', timestamp) as time_window,
  COUNT(*) as error_count,
  array_agg(DISTINCT error_code) as error_codes,
  array_agg(DISTINCT path) as paths
FROM error_logs
WHERE timestamp >= NOW() - INTERVAL '1 hour'
GROUP BY time_window
HAVING COUNT(*) > 5
ORDER BY error_count DESC;
```

### 4.2 User Correlation

**Pattern:** Errors affecting specific users or organizations

**Query Strategy:**
```sql
-- Find users with multiple errors
SELECT 
  user_id,
  org_id,
  COUNT(*) as error_count,
  array_agg(DISTINCT error_code) as error_codes
FROM error_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY user_id, org_id
HAVING COUNT(*) > 10
ORDER BY error_count DESC;
```

### 4.3 Endpoint Correlation

**Pattern:** Errors concentrated on specific API endpoints

**Query Strategy:**
```sql
-- Find problematic endpoints
SELECT 
  path,
  method,
  COUNT(*) as error_count,
  COUNT(DISTINCT user_id) as affected_users,
  AVG(response_time_ms) as avg_response_time
FROM error_logs
WHERE timestamp >= NOW() - INTERVAL '1 hour'
GROUP BY path, method
HAVING COUNT(*) > 5
ORDER BY error_count DESC;
```

### 4.4 Cascading Failure Detection

**Pattern:** One error causing multiple downstream failures

**Indicators:**
- Database connection error → Multiple 500 errors
- Auth service failure → All authenticated endpoints failing
- External API failure → Dependent features failing

**Detection Query:**
```sql
-- Find cascading failures
WITH error_sequences AS (
  SELECT 
    request_id,
    timestamp,
    error_code,
    LAG(error_code) OVER (PARTITION BY request_id ORDER BY timestamp) as prev_error
  FROM error_logs
  WHERE timestamp >= NOW() - INTERVAL '1 hour'
)
SELECT 
  prev_error,
  error_code,
  COUNT(*) as cascade_count
FROM error_sequences
WHERE prev_error IS NOT NULL
GROUP BY prev_error, error_code
ORDER BY cascade_count DESC;
```

---

## 5. Monitoring Queries

### 5.1 Error Rate Monitoring

**Elasticsearch/Splunk Query:**
```json
{
  "query": {
    "bool": {
      "must": [
        { "match": { "level": "error" } },
        { "range": { "timestamp": { "gte": "now-1h" } } }
      ]
    }
  },
  "aggs": {
    "errors_over_time": {
      "date_histogram": {
        "field": "timestamp",
        "interval": "5m"
      }
    },
    "error_codes": {
      "terms": { "field": "error.code.keyword", "size": 20 }
    }
  }
}
```

### 5.2 Alert Queries

**High Error Rate Alert:**
```sql
-- Alert if error rate > 10 errors/minute
SELECT 
  COUNT(*) as error_count
FROM error_logs
WHERE timestamp >= NOW() - INTERVAL '1 minute'
HAVING COUNT(*) > 10;
```

**Critical Error Alert:**
```sql
-- Alert on critical errors
SELECT *
FROM error_logs
WHERE 
  timestamp >= NOW() - INTERVAL '5 minutes'
  AND (
    error_code IN ('DATABASE_CONNECTION_FAILED', 'AUTH_SERVICE_DOWN')
    OR message LIKE '%FATAL%'
    OR message LIKE '%CRITICAL%'
  );
```

### 5.3 Performance Degradation Detection

**Query:**
```sql
-- Detect slow endpoints
SELECT 
  path,
  method,
  AVG(response_time_ms) as avg_time,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms) as p95_time,
  COUNT(*) as request_count
FROM request_logs
WHERE timestamp >= NOW() - INTERVAL '1 hour'
GROUP BY path, method
HAVING AVG(response_time_ms) > 1000 OR PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms) > 3000
ORDER BY avg_time DESC;
```

---

## 6. Code Locations Causing Errors

### 6.1 High-Risk Areas

**1. Database Operations**
- `server/src/services/supabaseDb.ts` - Race conditions, connection failures
- `server/src/services/database.ts` - Legacy connection handling
- **Lines:** `ensureUserRow`, `ensureOrgForUser`, `ensureDefaultLocation`

**2. Authentication Flow**
- `server/src/middleware/auth.ts` - Token validation failures
- `server/src/middleware/supabaseAuth.ts` - Session validation
- `src/hooks/useDashboardOverview.ts` - Race condition (fixed)
- **Lines:** Token extraction, session checks

**3. External API Integrations**
- `server/src/services/elevenLabsService.ts` - API failures, rate limits
- `server/src/services/calendarService.ts` - OAuth flow errors
- `server/src/services/twilioService.ts` - Webhook validation failures
- **Lines:** API calls, error handling

**4. Request Validation**
- `server/src/middleware/validateRequest.ts` - Schema validation failures
- **Lines:** Zod schema validation

**5. Error Handling**
- `server/src/middleware/errorHandler.ts` - Error transformation
- **Lines:** Error formatting, debug mode

### 6.2 Error-Prone Patterns

**Pattern 1: Missing Error Handling**
```typescript
// ❌ Bad: No error handling
const result = await someAsyncOperation();

// ✅ Good: Proper error handling
try {
  const result = await someAsyncOperation();
} catch (error) {
  StructuredLoggingService.error('Operation failed', error, context, req);
  throw new AppError(500, 'Operation failed', false);
}
```

**Pattern 2: Swallowed Errors**
```typescript
// ❌ Bad: Error swallowed
try {
  await operation();
} catch (error) {
  // Silent failure
}

// ✅ Good: Logged and handled
try {
  await operation();
} catch (error) {
  StructuredLoggingService.error('Operation failed', error, context, req);
  // Handle or rethrow
}
```

**Pattern 3: Race Conditions**
```typescript
// ❌ Bad: Race condition
if (!exists) {
  await create();
}

// ✅ Good: Handle race condition
try {
  await create();
} catch (error) {
  if (error.code === '23505') { // Unique constraint violation
    // Resource already exists, fetch it
    return await get();
  }
  throw error;
}
```

---

## 7. Anomaly Detection

### 7.1 Error Spike Detection

**Pattern:** Sudden increase in error rate

**Detection:**
```sql
WITH error_rates AS (
  SELECT 
    DATE_TRUNC('minute', timestamp) as minute,
    COUNT(*) as error_count
  FROM error_logs
  WHERE timestamp >= NOW() - INTERVAL '1 hour'
  GROUP BY minute
),
baseline AS (
  SELECT AVG(error_count) as avg_rate, STDDEV(error_count) as std_rate
  FROM error_rates
)
SELECT 
  minute,
  error_count,
  avg_rate,
  std_rate,
  (error_count - avg_rate) / NULLIF(std_rate, 0) as z_score
FROM error_rates, baseline
WHERE (error_count - avg_rate) / NULLIF(std_rate, 0) > 2
ORDER BY minute DESC;
```

### 7.2 Unusual Error Patterns

**Pattern:** New error codes or unusual error combinations

**Detection:**
```sql
-- Find new error codes in last hour
SELECT DISTINCT error_code
FROM error_logs
WHERE 
  timestamp >= NOW() - INTERVAL '1 hour'
  AND error_code NOT IN (
    SELECT DISTINCT error_code 
    FROM error_logs 
    WHERE timestamp >= NOW() - INTERVAL '7 days' 
    AND timestamp < NOW() - INTERVAL '1 hour'
  );
```

---

## 8. Recommendations

### 8.1 Immediate Actions

1. **Fix Syntax Error**
   - **File:** `server/src/middleware/errorHandler.ts:201`
   - **Issue:** Missing comma in error code map
   - **Fix:** Add comma after `'BAD_REQUEST'`

2. **Standardize Error Logging**
   - Replace `console.error` with `StructuredLoggingService.error` throughout codebase
   - Ensure all errors include requestId and context

3. **Add Error Monitoring**
   - Set up error rate alerts
   - Configure dashboards for error trends
   - Implement PagerDuty/Slack alerts for critical errors

### 8.2 Short-Term Improvements

1. **Error Tracking**
   - Integrate Sentry or similar error tracking service
   - Add error fingerprinting for grouping
   - Track error trends over time

2. **Enhanced Logging**
   - Add structured logging to all external API calls
   - Log request/response payloads (sanitized) for debugging
   - Add performance metrics (response times, query durations)

3. **Error Recovery**
   - Implement retry logic for transient failures
   - Add circuit breakers for external services
   - Implement graceful degradation

### 8.3 Long-Term Improvements

1. **Observability**
   - Implement distributed tracing (OpenTelemetry)
   - Add APM (Application Performance Monitoring)
   - Set up log aggregation (ELK stack, Datadog, etc.)

2. **Error Prevention**
   - Add comprehensive integration tests
   - Implement chaos engineering for resilience testing
   - Regular error pattern reviews

3. **Documentation**
   - Document all error codes and their meanings
   - Create runbooks for common error scenarios
   - Maintain error pattern playbook

---

## 9. Error Code Reference

### Standard HTTP Error Codes

| Code | Name | Usage |
|------|------|-------|
| 400 | BAD_REQUEST | Invalid request format |
| 401 | UNAUTHORIZED | Missing or invalid authentication |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Resource conflict (e.g., duplicate) |
| 422 | VALIDATION_ERROR | Request validation failed |
| 429 | RATE_LIMIT_EXCEEDED | Too many requests |
| 500 | INTERNAL_SERVER_ERROR | Unexpected server error |
| 502 | BAD_GATEWAY | External service error |
| 503 | SERVICE_UNAVAILABLE | Service temporarily unavailable |
| 504 | GATEWAY_TIMEOUT | External service timeout |

### Custom Error Codes

| Code | Description | Location |
|------|-------------|----------|
| CORS_POLICY_VIOLATION | CORS origin rejected | `errorHandler.ts` |
| DATABASE_CONNECTION_FAILED | Database connection error | `database.ts` |
| SUPABASE_ERROR | Supabase client error | `supabaseDb.ts` |
| ELEVENLABS_ERROR | ElevenLabs API error | `elevenLabsService.ts` |
| CALENDAR_ERROR | Calendar integration error | `calendarService.ts` |
| TWILIO_ERROR | Twilio service error | `twilioService.ts` |

---

## 10. Log Analysis Tools

### Recommended Tools

1. **Log Aggregation**
   - **ELK Stack** (Elasticsearch, Logstash, Kibana)
   - **Datadog** - Cloud-native log management
   - **Splunk** - Enterprise log analysis

2. **Error Tracking**
   - **Sentry** - Real-time error tracking
   - **Rollbar** - Error monitoring and tracking
   - **Bugsnag** - Error monitoring

3. **APM**
   - **New Relic** - Application performance monitoring
   - **Datadog APM** - Distributed tracing
   - **OpenTelemetry** - Open-source observability

### Log Analysis Commands

**Extract errors from logs:**
```bash
# Extract all errors
grep -E "\[ErrorHandler\]|ERROR|error|❌" server.log

# Extract errors with request IDs
grep -E "requestId.*req-" server.log

# Extract errors by component
grep -E "\[(Database|Auth|Calendar|Twilio|ElevenLabs)\].*Error" server.log

# Count errors by type
grep -E "error_code.*:" server.log | sort | uniq -c | sort -rn
```

**Analyze error patterns:**
```bash
# Find most common error messages
grep -oP "message[:\s]+\K[^\n]+" server.log | sort | uniq -c | sort -rn | head -20

# Find errors by path
grep -oP "path[:\s]+\K[^\s]+" server.log | sort | uniq -c | sort -rn | head -20

# Extract stack traces
grep -A 10 "stack[:\s]" server.log
```

---

## 11. Conclusion

This error analysis provides a comprehensive foundation for error detection, monitoring, and prevention in the AIDevelo.ai codebase. Key findings:

1. **Well-structured error handling** with RFC 7807 Problem Details
2. **Comprehensive logging infrastructure** with structured logging
3. **Known race condition issues** documented and partially fixed
4. **Multiple external service integrations** requiring robust error handling
5. **Need for centralized error monitoring** and alerting

**Next Steps:**
1. Fix syntax error in `errorHandler.ts`
2. Implement error tracking service (Sentry)
3. Set up log aggregation and monitoring
4. Create error runbooks for common scenarios
5. Regular error pattern reviews

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-27  
**Maintained By:** Error Detective Team
