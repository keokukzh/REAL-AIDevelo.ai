# Cloudflare Pages Function Proxy - CORB/CSP Fix

## Root Cause

**Problem:** Browser was making direct requests to `https://real-aidevelo-ai.onrender.com/api/*`, which:
1. Violated CSP `connect-src 'self'` (onrender.com not whitelisted)
2. Triggered CORB (Cross-Origin Read Blocking) when response headers were incorrect
3. Caused "Network Error" in dashboard

**Previous Solution (Failed):** `_redirects` file with proxy rule:
```
/api/* https://real-aidevelo-ai.onrender.com/api/:splat 200
```

**Why It Failed:**
- `_redirects` may be treated as HTTP redirects (301/302) rather than true server-side proxy
- Browser sees redirect → makes cross-origin request → CORB blocks it
- CSP violation because browser still calls onrender.com directly

**New Solution:** Cloudflare Pages Function (server-side proxy)
- Function runs on Cloudflare edge (server-side)
- Browser only sees same-origin requests to `https://aidevelo.ai/api/*`
- Function forwards to Render backend server-side
- No redirects, no cross-origin requests from browser

## Implementation

### 1. Pages Function (`functions/api/[[splat]].ts`)

**Purpose:** Catch-all proxy for `/api/*` requests

**Key Features:**
- Reads `RENDER_API_ORIGIN` from environment (defaults to `https://real-aidevelo-ai.onrender.com`)
- Reconstructs target URL: `${RENDER_API_ORIGIN}/api/${splat}${search}`
- Forwards method, headers (Authorization, Content-Type, etc.), and body
- Returns upstream response as-is (status, headers, body)
- Safety: Only allows HTTPS origins (prevents open proxy)

**Environment Variable:**
- `RENDER_API_ORIGIN` (optional, defaults to `https://real-aidevelo-ai.onrender.com`)

### 2. Routes Configuration (`public/_routes.json`)

**Purpose:** Tell Cloudflare Pages which paths should invoke Functions

**Content:**
```json
{
  "version": 1,
  "include": ["/api/*"],
  "exclude": []
}
```

**Effect:**
- Only `/api/*` requests invoke the Function
- Static assets (`/assets/*`, etc.) remain static (not proxied)
- SPA routes (`/dashboard`, etc.) still work via `_redirects`

### 3. Updated Redirects (`public/_redirects`)

**Before:**
```
/api/* https://real-aidevelo-ai.onrender.com/api/:splat 200
/* /index.html 200
```

**After:**
```
/* /index.html 200
```

**Why:** Proxy rule removed - Pages Function handles `/api/*` now.

### 4. Frontend API Base URL (`src/services/apiBase.ts`)

**Production Behavior:**
- If `VITE_API_URL` not set: Uses `window.location.origin + '/api'` = `https://aidevelo.ai/api`
- If `VITE_API_URL` set to `/api`: Uses `https://aidevelo.ai/api`
- If `VITE_API_URL` set to absolute URL: Uses it (bypasses proxy - not recommended)

**Recommendation:** Don't set `VITE_API_URL` in Cloudflare Pages (uses fallback to same-origin).

## Cloudflare Pages Environment Variables

**Required (for Pages Function):**
- `RENDER_API_ORIGIN` (optional): `https://real-aidevelo-ai.onrender.com` (default if not set)

**Frontend (already set):**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL` (optional - should NOT be set, or set to `/api`)

## Verification

### Test Commands (After Deploy)

**1. Health Endpoint:**
```bash
curl -I https://aidevelo.ai/api/health
```

**Expected:**
```
HTTP/2 200
Content-Type: application/json; charset=utf-8
...
```

**2. Preflight Endpoint:**
```bash
curl -I https://aidevelo.ai/api/db/preflight
```

**Expected:**
```
HTTP/2 200
Content-Type: application/json; charset=utf-8
...
```

**3. Browser DevTools Network Tab:**

**Request URL:** `https://aidevelo.ai/api/dashboard/overview` ✅ (NOT `onrender.com`)

**Status:** 200 OK ✅

**Response Headers:**
```
Content-Type: application/json; charset=utf-8
```

**Console:** No CSP or CORB errors ✅

### Proof Outputs (Sanitized)

**Request URL in Browser:**
```
https://aidevelo.ai/api/dashboard/overview
```

**Response Headers:**
```
HTTP/2 200
Content-Type: application/json; charset=utf-8
Date: ...
Server: cloudflare
```

**No Headers:**
- ❌ `Access-Control-Allow-Origin` (not needed - same-origin)
- ❌ `Location` (no redirect)

## Files Changed

1. **Created:** `functions/api/[[splat]].ts` - Pages Function proxy
2. **Created:** `public/_routes.json` - Routes configuration
3. **Modified:** `public/_redirects` - Removed proxy rule
4. **Modified:** `src/services/apiBase.ts` - Added dev logging

## Git Commit

```
<commit-hash> fix(csp): implement Cloudflare Pages Function proxy for /api to fix CORB/CSP issues
```

## Troubleshooting

### If Function Not Invoked:

1. Check `public/_routes.json` exists and includes `/api/*`
2. Verify Function file is at `functions/api/[[splat]].ts`
3. Check Cloudflare Pages deployment logs for Function errors

### If 502 Bad Gateway:

1. Check `RENDER_API_ORIGIN` is set correctly in Cloudflare Pages
2. Verify Render backend is running: `curl https://real-aidevelo-ai.onrender.com/api/health`
3. Check Function logs in Cloudflare Dashboard

### If Still CORB Errors:

1. Verify browser requests go to `aidevelo.ai/api/*` (not `onrender.com`)
2. Check response `Content-Type` header is `application/json`
3. Verify CSP `connect-src` includes `'self'`

