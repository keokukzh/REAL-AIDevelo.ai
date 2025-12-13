# Supabase Auth Redirect URLs Configuration

## Required Settings in Supabase Dashboard

Go to **Supabase Dashboard → aidevelo.prod → Authentication → URL Configuration**

### Site URL
```
https://aidevelo.ai
```

### Additional Redirect URLs

**Copy/Paste these URLs** (one per line) into "Additional Redirect URLs":

```
https://aidevelo.ai/auth/callback
https://*.pages.dev/auth/callback
http://localhost:4000/auth/callback
http://localhost:5173/auth/callback
```

**Important:** The wildcard `*.pages.dev` covers all Cloudflare Pages preview deployments.

## Frontend Routes

The frontend uses these routes for authentication:
- `/auth/callback` - Handles Supabase auth callback (see `src/pages/AuthCallbackPage.tsx`)
- `/login` - Login page
- `/dashboard` - Redirect target after successful auth

## Magic Link Configuration

Magic links are configured in `src/contexts/AuthContext.tsx`:
```typescript
emailRedirectTo: `${window.location.origin}/auth/callback`
```

This ensures magic links redirect to the correct callback URL based on the current environment.

## Verification

After setting up redirect URLs:
1. Test magic link login from production (`https://aidevelo.ai`)
2. Test magic link login from local dev (`http://localhost:4000`)
3. Verify redirect works correctly to `/dashboard` after authentication
