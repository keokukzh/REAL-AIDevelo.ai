# Dashboard Fix Plan - Production

**Goal:** Make `GET /api/dashboard/overview` return 200 OK after login

---

## STEP 1: Browser Repro + Proof Template

**Status:** ✅ **READY** - See `docs/BROWSER_TEST_CHECKLIST.md`

**Instructions:**
1. Open Incognito window
2. Login at `https://aidevelo.ai/login`
3. Navigate to `/dashboard`
4. In DevTools Network tab, capture `/api/dashboard/overview` request
5. Collect: Status, Response headers (`x-aidevelo-*`), Response body

**Output:** Browser test checklist provided. User must paste back results.

---

## STEP 2: If 401 Error

### A) Determine Root Cause

**Check `x-aidevelo-auth-present` header:**

#### If `x-aidevelo-auth-present: 0` → Proxy Not Forwarding Auth

**Problem:** Cloudflare Pages Function not forwarding `Authorization` header

**Fix:**
1. Verify `functions/api/[[splat]].ts` includes `Authorization` in `headersToForward` array ✅ (already done)
2. Check if function is deployed to Cloudflare Pages
3. Trigger fresh deployment

**Proof Commands:**
```bash
# Verify function exists in repo
Test-Path -LiteralPath "functions/api/[[splat]].ts"

# Verify _routes.json is in dist
Test-Path dist/_routes.json

# Check if proxy is active (should show x-aidevelo-proxy: 1)
curl.exe -s -D - -o NUL "https://aidevelo.ai/api/health"
```

**Expected Output:**
```
HTTP/1.1 200 OK
x-aidevelo-proxy: 1
x-aidevelo-backend-sha: 63a6df9...
```

#### If `x-aidevelo-auth-present: 1` → Backend Rejecting Token

**Problem:** Supabase environment variables mismatch

**Required Checks:**

1. **Render Environment Variables:**
   - `SUPABASE_URL` MUST equal `https://rckuwfcsqwwylffecwur.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` MUST be from same project (service_role key, not anon)

2. **Cloudflare Pages Environment Variables:**
   - `VITE_SUPABASE_URL` MUST equal `https://rckuwfcsqwwylffecwur.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` MUST be from same project (anon key)

**Debug Endpoint:**

**Command:**
```bash
curl.exe -s "https://aidevelo.ai/api/debug/env"
```

**Expected Output:**
```json
{
  "supabase": {
    "host": "rckuwfcsqwwylffecwur.supabase.co",
    "projectRef": "rckuwfcsqwwylffecwur",
    "urlSet": true,
    "serviceRoleKeySet": true
  },
  "backend": {
    "commitSha": "63a6df9ef1bfd604f150aca473662c72f9f8e2b9",
    "nodeEnv": "production"
  }
}
```

**If Mismatch Found:**
- `projectRef` should be `rckuwfcsqwwylffecwur`
- If different, update Render `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Update Cloudflare `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Redeploy both services

---

## STEP 3: If 500 Error

### A) Locate Error

**From Response Body:**
```json
{
  "error": "Failed to get dashboard overview",
  "step": "ensureUserRow|ensureOrgForUser|ensureDefaultLocation|ensureAgentConfig",
  "requestId": "req-1234567890-abc123"
}
```

**From Response Headers:**
```
rndr-id: 97735eee-c70e-4b7d
```

### B) Find Logs

1. Go to Render Dashboard → Logs
2. Search for: `requestId: req-1234567890-abc123` OR `rndr-id: 97735eee-c70e-4b7d`
3. Find stacktrace

### C) Common Issues & Fixes

#### Issue: Unique Constraint Violation (23505)

**Error:** `duplicate key value violates unique constraint`

**Root Cause:** Race condition - multiple requests creating same user/org simultaneously

**Fix:** Already implemented in `server/src/services/supabaseDb.ts`:
- `ensureUserRow` handles unique constraint violations
- `ensureOrgForUser` calls `ensureUserRow` if user doesn't exist
- Both functions retry fetching existing records on 23505 errors

**Verification:**
- Check code has race condition handling (already done in commit `fccdf90`)
- If still failing, check Render is running latest code (`x-aidevelo-backend-sha` header)

#### Issue: Missing Tables

**Error:** `relation "users" does not exist`

**Root Cause:** Schema not applied to Supabase

**Fix:**
1. Run `server/db/schema.sql` in Supabase SQL Editor
2. Run `server/db/security_hardening.sql` in Supabase SQL Editor
3. Verify with: `curl.exe -s "https://aidevelo.ai/api/db/preflight"`

**Expected Output:**
```json
{
  "ok": true,
  "missing": [],
  "warnings": [],
  "projectUrl": "https://rckuwfcsqwwylffecwur.supabase.co",
  "timestamp": "..."
}
```

### D) Improve Error Response

**Status:** ✅ **ALREADY DONE** - Error responses include `requestId`, `step`, and `error` message (commit `fccdf90`)

**Code Location:**
- `server/src/controllers/defaultAgentController.ts` - `getDashboardOverview` error handler
- Returns: `{ error, step, requestId }`

---

## STEP 4: Verification After Fix

### A) Health Check

**Command:**
```bash
curl.exe -s -D - -o NUL "https://aidevelo.ai/api/health"
```

**Expected Output:**
```
HTTP/1.1 200 OK
x-aidevelo-proxy: 1
x-aidevelo-backend-sha: 63a6df9ef1bfd604f150aca473662c72f9f8e2b9
```

### B) DB Preflight

**Command:**
```bash
curl.exe -s -D - -o NUL "https://aidevelo.ai/api/db/preflight"
```

**Expected Output:**
```
HTTP/1.1 200 OK
x-aidevelo-proxy: 1
```

### C) Debug Env

**Command:**
```bash
curl.exe -s "https://aidevelo.ai/api/debug/env"
```

**Expected Output:**
```json
{
  "supabase": {
    "host": "rckuwfcsqwwylffecwur.supabase.co",
    "projectRef": "rckuwfcsqwwylffecwur",
    "urlSet": true,
    "serviceRoleKeySet": true
  },
  "backend": {
    "commitSha": "63a6df9ef1bfd604f150aca473662c72f9f8e2b9",
    "nodeEnv": "production"
  }
}
```

### D) Browser Test (Repeat STEP 1)

**Instructions:** Same as STEP 1, but after fixes applied

**Expected Result:**
- Status: `200 OK`
- Headers: `x-aidevelo-proxy: 1`, `x-aidevelo-auth-present: 1`, `x-aidevelo-backend-sha: <hash>`
- Response: Valid JSON with dashboard data

---

## READY REPORT Template

After all fixes applied and verified:

```
=== READY REPORT ===

Frontend Commit: <Cloudflare Pages deploy commit>
Backend Commit: 63a6df9ef1bfd604f150aca473662c72f9f8e2b9 (from x-aidevelo-backend-sha)

/api/dashboard/overview Status: 200 OK ✅

Response Headers:
x-aidevelo-proxy: 1 ✅
x-aidevelo-auth-present: 1 ✅
x-aidevelo-backend-sha: 63a6df9... ✅

Remaining Known Risks:
1. <risk 1>
2. <risk 2>
...
```

---

## Summary

**Current Status:**
- ✅ Proxy active and forwarding requests
- ✅ Backend running latest code
- ✅ Debug endpoint created (`/api/debug/env`)
- ✅ Error handling improved (requestId, step)
- ✅ Race condition handling implemented

**Next Action:**
1. User runs browser test (STEP 1)
2. Based on results, apply STEP 2 (401) or STEP 3 (500) fixes
3. Verify with STEP 4 commands
4. Generate READY REPORT

**Missing Evidence:**
- Browser test results (status code, headers, response body)
- If 401: `x-aidevelo-auth-present` value
- If 500: `requestId`, `step`, and `rndr-id` for log lookup

