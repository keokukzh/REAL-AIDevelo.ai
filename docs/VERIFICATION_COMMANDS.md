# Dashboard Fix Plan - Verification Commands

This document provides all verification commands from the Dashboard Fix Plan for easy reference.

## Local Testing

### Run Verification Script

```bash
cd server
npm run verify:dashboard
```

Or with custom base URL:
```bash
node scripts/verifyDashboardFix.js http://localhost:5000
```

### Manual Local Tests

```bash
# Health Check
curl http://localhost:5000/api/health

# DB Preflight
curl http://localhost:5000/api/db/preflight

# Debug Env
curl http://localhost:5000/api/debug/env
```

## Production Testing

### A) Health Check

```bash
curl.exe -s -D - -o NUL "https://aidevelo.ai/api/health"
```

**Expected Output:**
```
HTTP/1.1 200 OK
x-aidevelo-proxy: 1
x-aidevelo-backend-sha: <commit-sha>
```

### B) DB Preflight

```bash
curl.exe -s "https://aidevelo.ai/api/db/preflight"
```

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

**Check Headers:**
```bash
curl.exe -s -D - -o NUL "https://aidevelo.ai/api/db/preflight"
```

**Expected Headers:**
```
HTTP/1.1 200 OK
x-aidevelo-proxy: 1
x-aidevelo-backend-sha: <commit-sha>
```

### C) Debug Env

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
    "commitSha": "<commit-sha>",
    "nodeEnv": "production"
  }
}
```

**Check Headers:**
```bash
curl.exe -s -D - -o NUL "https://aidevelo.ai/api/debug/env"
```

**Expected Headers:**
```
HTTP/1.1 200 OK
x-aidevelo-proxy: 1
x-aidevelo-backend-sha: <commit-sha>
```

### D) Dashboard Overview (Requires Auth)

**Browser Test:**
1. Open Incognito window
2. Login at `https://aidevelo.ai/login`
3. Navigate to `/dashboard`
4. In DevTools Network tab, capture `/api/dashboard/overview` request
5. Collect: Status, Response headers (`x-aidevelo-*`), Response body

**Expected Result:**
- Status: `200 OK`
- Headers: 
  - `x-aidevelo-proxy: 1` ✅
  - `x-aidevelo-auth-present: 1` ✅
  - `x-aidevelo-backend-sha: <hash>` ✅
- Response: Valid JSON with dashboard data

**With curl (requires auth token):**
```bash
curl.exe -H "Authorization: Bearer <token>" "https://aidevelo.ai/api/dashboard/overview"
```

## Verification Checklist

- [ ] Health endpoint returns 200 with `x-aidevelo-backend-sha` header
- [ ] DB preflight returns 200 with `x-aidevelo-backend-sha` header
- [ ] Debug env returns correct Supabase project ref (`rckuwfcsqwwylffecwur`)
- [ ] Debug env returns `x-aidevelo-backend-sha` header
- [ ] All production endpoints show `x-aidevelo-proxy: 1` header (via Cloudflare)
- [ ] Dashboard overview returns 200 after login
- [ ] Dashboard overview shows `x-aidevelo-auth-present: 1` when authenticated

## Troubleshooting

### If `x-aidevelo-proxy: 1` is missing
- Cloudflare Pages function may not be deployed
- Check `functions/api/[[splat]].ts` exists
- Verify `_routes.json` is in `dist/` after build
- Trigger fresh Cloudflare Pages deployment

### If `x-aidevelo-auth-present: 0` on authenticated request
- Proxy not forwarding `Authorization` header
- Check `functions/api/[[splat]].ts` includes `Authorization` in `headersToForward`

### If `x-aidevelo-backend-sha` is missing
- Backend may not be running latest code
- Check Render deployment status
- Verify `RENDER_GIT_COMMIT` environment variable is set

### If Supabase project ref is wrong
- Check Render `SUPABASE_URL` environment variable
- Check Cloudflare `VITE_SUPABASE_URL` environment variable
- Both should point to `https://rckuwfcsqwwylffecwur.supabase.co`
