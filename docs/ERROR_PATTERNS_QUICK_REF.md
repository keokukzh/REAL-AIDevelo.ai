# Error Patterns Quick Reference

**Quick lookup guide for common errors and their solutions**

---

## 🔴 Critical Errors

### Database Connection Failed
```
[Database] ❌ Connection test failed
ENOTFOUND
ECONNREFUSED
```

**Quick Fix:**
1. Check `DATABASE_URL` env var format
2. Verify Supabase project is active
3. Check network connectivity

**Regex:** `\[Database\].*❌|ENOTFOUND|ECONNREFUSED`

---

### Authentication Failure (401)
```
UNAUTHORIZED
401.*Unauthorized
Invalid.*token
```

**Quick Fix:**
1. Check Supabase session is valid
2. Verify Authorization header present
3. Check token expiry

**Regex:** `UNAUTHORIZED|401|Invalid.*token`

---

### CORS Policy Violation
```
[CORS Error]
CORS_POLICY_VIOLATION
Rejected origin
```

**Quick Fix:**
1. Add origin to `ALLOWED_ORIGINS`
2. Check SSL termination config
3. Verify CORS middleware order

**Regex:** `\[CORS.*Error\]|CORS_POLICY_VIOLATION`

---

## 🟡 Warning Patterns

### Race Condition
```
unique constraint violation
23505.*duplicate key
ensureUserRow.*failed
```

**Quick Fix:**
1. Check concurrent request handling
2. Verify idempotency logic
3. Review transaction isolation

**Regex:** `unique constraint|23505|duplicate key`

---

### External API Error
```
[ElevenLabs].*Error
[CalendarService].*Error
Rate limit exceeded
```

**Quick Fix:**
1. Verify API keys are valid
2. Check rate limit headers
3. Review service status

**Regex:** `\[(ElevenLabs|CalendarService|TwilioService)\].*Error`

---

### Validation Error (422)
```
VALIDATION_ERROR
422.*Validation.*failed
ZodError
```

**Quick Fix:**
1. Check request payload schema
2. Verify required fields present
3. Review Zod schema definition

**Regex:** `VALIDATION_ERROR|422.*Validation|ZodError`

---

## 📊 Log Extraction Commands

### Extract All Errors
```bash
grep -E "\[ErrorHandler\]|ERROR|error|❌" server.log
```

### Extract by Component
```bash
# Database errors
grep "\[Database\].*❌" server.log

# Auth errors
grep -E "\[.*Auth.*\].*Error|UNAUTHORIZED" server.log

# Calendar errors
grep "\[Calendar.*\].*Error" server.log
```

### Extract Request IDs
```bash
grep -oP "requestId[:\s]+\K(req-\d+-\w+)" server.log
```

### Count Errors by Type
```bash
grep -oP "error_code[:\s]+\K\w+" server.log | sort | uniq -c | sort -rn
```

---

## 🔍 Error Correlation

### Find Related Errors (Same Request)
```bash
# Extract all logs for a specific requestId
grep "req-1234567890-abc123" server.log
```

### Find Errors by User
```bash
grep "userId.*<user-id>" server.log
```

### Find Errors by Endpoint
```bash
grep "path.*/api/dashboard/overview" server.log
```

---

## 🚨 Alert Thresholds

| Metric | Threshold | Action |
|--------|-----------|--------|
| Error Rate | > 10 errors/minute | Investigate |
| Critical Errors | Any occurrence | Immediate alert |
| Error Spike | 2x baseline | Review recent changes |
| User Error Rate | > 5 errors/user/hour | Contact user |

---

## 📝 Common Error Codes

| Code | Meaning | HTTP Status |
|------|---------|-------------|
| BAD_REQUEST | Invalid request format | 400 |
| UNAUTHORIZED | Missing/invalid auth | 401 |
| FORBIDDEN | Insufficient permissions | 403 |
| NOT_FOUND | Resource not found | 404 |
| VALIDATION_ERROR | Request validation failed | 422 |
| INTERNAL_SERVER_ERROR | Unexpected error | 500 |
| CORS_POLICY_VIOLATION | CORS origin rejected | 403 |

---

## 🛠️ Debug Mode

**Enable Debug Mode:**
```bash
# Environment variable
export DEBUG_ERRORS=true

# Or header (requires TOOL_SHARED_SECRET)
curl -H "x-aidevelo-debug: <secret>" ...
```

**Debug Mode Includes:**
- Full stack traces
- Supabase error details
- Validation error details
- Request context

---

## 📚 Related Documentation

- [ERROR_ANALYSIS.md](./ERROR_ANALYSIS.md) - Comprehensive error analysis
- [TROUBLESHOOTING.md](../TROUBLESHOOTING.md) - General troubleshooting guide
- [AUTH_500_FIX_PROOF.md](./AUTH_500_FIX_PROOF.md) - Auth error fixes

---

**Last Updated:** 2025-01-27
