# Cloudflare Pages API Proxy Configuration

## Overview

Production frontend at `https://aidevelo.ai` uses Cloudflare Pages proxy to forward `/api/*` requests to the Render backend at `https://real-aidevelo-ai.onrender.com/api/*`. This allows same-origin API calls, satisfying CSP `connect-src 'self'` without needing to whitelist `onrender.com`.

## Configuration

### 1. Cloudflare Pages Redirects (`public/_redirects`)

```
/api/* https://real-aidevelo-ai.onrender.com/api/:splat 200
/* /index.html 200
```

**Important:** The proxy rule MUST come BEFORE the SPA catch-all rule.

**How it works:**
- Requests to `https://aidevelo.ai/api/dashboard/overview` are proxied to `https://real-aidevelo-ai.onrender.com/api/dashboard/overview`
- Status code 200 means the proxy response is returned as-is (not a redirect)
- `:splat` captures the path after `/api/`

### 2. Frontend API Base URL

**File:** `src/services/apiBase.ts`

**Production Behavior:**
- If `VITE_API_URL` is set to `/api` (or relative path), it becomes `https://aidevelo.ai/api`
- If `VITE_API_URL` is not set, fallback is `window.location.origin + '/api'` = `https://aidevelo.ai/api`
- This ensures all API calls are same-origin, satisfying CSP

**Cloudflare Pages Environment Variable:**
- **Option 1 (Recommended):** Set `VITE_API_URL=/api` (relative path)
- **Option 2:** Don't set `VITE_API_URL` (uses fallback to same-origin `/api`)

**Note:** Do NOT set `VITE_API_URL=https://real-aidevelo-ai.onrender.com/api` in production, as this would bypass the proxy and trigger CSP violations.

### 3. Content Security Policy

**File:** `public/_headers`

**Current CSP:**
```
connect-src 'self' https://*.supabase.co https://*.supabase.io wss://*.supabase.co;
```

**Status:** ✅ No changes needed. `'self'` already allows same-origin requests to `/api/*`.

**Why it works:**
- Frontend calls `https://aidevelo.ai/api/...` (same-origin)
- Cloudflare Pages proxies to Render backend
- CSP `connect-src 'self'` is satisfied
- No need to add `https://real-aidevelo-ai.onrender.com` to CSP

## Verification

### After Deployment:

1. **Browser DevTools → Network Tab:**
   - Request URL: `https://aidevelo.ai/api/dashboard/overview` ✅ (NOT `onrender.com`)
   - Status: 200 OK ✅
   - Response: Valid JSON ✅

2. **CSP Header Check:**
   ```bash
   curl -I https://aidevelo.ai
   ```
   - Should show: `Content-Security-Policy: ... connect-src 'self' ...`
   - Should NOT include `onrender.com` in `connect-src` ✅

3. **Console Errors:**
   - No CSP violations ✅
   - No "Refused to connect" errors ✅

## Troubleshooting

### If API calls still go to `onrender.com`:

1. Check `VITE_API_URL` in Cloudflare Pages → Settings → Environment Variables
   - Should be `/api` or not set (not the full Render URL)

2. Check `public/_redirects` is deployed:
   - File must be in `public/` directory
   - Must be included in build output (`dist/`)

3. Verify redirect rule order:
   - Proxy rule (`/api/*`) must come BEFORE SPA rule (`/*`)

### If proxy returns 404:

1. Check Render backend is running:
   ```bash
   curl https://real-aidevelo-ai.onrender.com/api/health
   ```

2. Verify redirect syntax:
   - Must use `:splat` (not `*` or `$1`)
   - Status code must be `200` (not `301` or `302`)

### If CSP still blocks:

1. Check `public/_headers` is deployed
2. Verify CSP header includes `connect-src 'self'`
3. Check browser console for exact CSP violation message

## Development vs Production

**Development (localhost):**
- API calls go directly to `http://localhost:5000/api`
- No proxy needed
- CSP not enforced (dev server)

**Production (Cloudflare Pages):**
- API calls go to `https://aidevelo.ai/api` (same-origin)
- Cloudflare Pages proxies to Render backend
- CSP `connect-src 'self'` satisfied

