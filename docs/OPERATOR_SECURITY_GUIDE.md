# Operator Security Guide

## Environment Variables Security

### Critical Secrets (Never Commit to Git)

All secrets must be stored in environment variables only:

#### Frontend (Cloudflare Pages)
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `RENDER_API_ORIGIN` - Backend API origin (optional, has fallback)

#### Backend (Render)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (bypasses RLS)
- `ELEVENLABS_API_KEY` - ElevenLabs API key
- `TWILIO_AUTH_TOKEN` or (`TWILIO_API_KEY_SID` + `TWILIO_API_KEY_SECRET`)
- `TOKEN_ENCRYPTION_KEY` - Calendar token encryption key (32-byte base64)
- `TOOL_SHARED_SECRET` - Shared secret for tool webhooks
- `GOOGLE_OAUTH_CLIENT_SECRET` - Google OAuth client secret

### Verification Checklist

After deployment, verify:
- [ ] No secrets in git history (use `git log -p` to check)
- [ ] `.env` files are in `.gitignore`
- [ ] All secrets are in Cloudflare Pages / Render environment variables
- [ ] `VITE_DEV_BYPASS_AUTH` is NOT set in production (Cloudflare Pages)
- [ ] `DEV_BYPASS_AUTH` is NOT set in production (Render)

## Key Rotation Procedure

### When to Rotate
- After security incident
- Quarterly (recommended)
- When team member leaves
- When key is exposed

### Rotation Steps

#### 1. Supabase Keys
1. Go to Supabase Dashboard → Settings → API
2. Generate new service role key
3. Update `SUPABASE_SERVICE_ROLE_KEY` in Render
4. Update `VITE_SUPABASE_ANON_KEY` in Cloudflare Pages (if changed)
5. Restart services
6. Revoke old key after verification

#### 2. ElevenLabs API Key
1. Go to ElevenLabs Dashboard → Settings → API Keys
2. Create new API key
3. Update `ELEVENLABS_API_KEY` in Render
4. Restart backend service
5. Revoke old key after verification

#### 3. Twilio Credentials
1. Go to Twilio Console → Account → API Keys & Tokens
2. Create new API Key (recommended) or regenerate Auth Token
3. Update `TWILIO_API_KEY_SID` + `TWILIO_API_KEY_SECRET` (or `TWILIO_AUTH_TOKEN`) in Render
4. Restart backend service
5. Revoke old credentials after verification

#### 4. Token Encryption Key
**WARNING**: Rotating this key will make existing encrypted calendar tokens unreadable!

1. Generate new key: `openssl rand -base64 32`
2. Update `TOKEN_ENCRYPTION_KEY` in Render
3. Restart backend service
4. Users will need to reconnect their calendars

#### 5. Tool Shared Secret
1. Generate new secret: `openssl rand -hex 32`
2. Update `TOOL_SHARED_SECRET` in Render
3. Restart backend service
4. Update any external systems using this secret

## Production Hardening

### Rate Limits

Rate limits are configured in `server/src/middleware/security.ts`:

- **Auth endpoints**: 5 requests per 15 minutes
- **Agent endpoints**: 100 requests per 15 minutes
- **Dashboard**: 200 requests per 15 minutes
- **Webchat**: 20 requests per minute
- **Default**: 100 requests per 15 minutes

### CORS Configuration

Production CORS is restricted to:
- `https://aidevelo.ai`
- `https://www.aidevelo.ai`
- `*.aidevelo.ai` (subdomains)

Development allows `localhost` origins.

### Dev Bypass Auth

**CRITICAL**: Dev bypass auth must be disabled in production:

- Frontend: `VITE_DEV_BYPASS_AUTH` must NOT be set in Cloudflare Pages
- Backend: `DEV_BYPASS_AUTH` must NOT be set in Render

The `DevQuickLogin` component automatically hides itself if `VITE_DEV_BYPASS_AUTH !== 'true'`.

### Public Endpoints

Public endpoints (no auth required):
- `/api/twilio/voice/inbound` - Twilio webhook (signature verified)
- `/api/twilio/voice/status` - Twilio status callback (signature verified)
- `/api/webchat/message` - Webchat widget (widgetKey validated)
- `/health` - Health check
- `/api/health` - API health check

All other endpoints require Supabase JWT authentication.

## Monitoring

### Logs to Monitor

1. **Authentication failures**: High rate of 401s may indicate attack
2. **Rate limit hits**: 429 responses indicate abuse attempts
3. **CORS rejections**: Unauthorized origin attempts
4. **Webhook signature failures**: Invalid Twilio webhook attempts

### Alert Thresholds

- > 10 auth failures per minute from same IP
- > 5 rate limit hits per minute
- > 20 CORS rejections per minute
- Any webhook signature failures (should be zero)

## Incident Response

### If Key is Exposed

1. **Immediately rotate the exposed key** (see rotation steps above)
2. Check access logs for unauthorized usage
3. Review git history to find when key was exposed
4. If key was in git, consider force-pushing to remove from history (requires team coordination)
5. Notify affected users if data was accessed

### If Service is Compromised

1. Rotate all keys immediately
2. Review access logs
3. Check for unauthorized data access
4. Review Supabase RLS policies
5. Consider temporary service shutdown if critical

## Best Practices

1. **Never commit secrets to git** - Use environment variables only
2. **Use API Keys instead of Auth Tokens** - More secure (Twilio, etc.)
3. **Rotate keys regularly** - Quarterly rotation recommended
4. **Monitor access logs** - Set up alerts for suspicious activity
5. **Use different keys for dev/prod** - Never share keys between environments
6. **Limit key permissions** - Use least-privilege principle
7. **Document key usage** - Keep track of which services use which keys

## Verification Commands

### Check for secrets in git
```bash
# Search for common secret patterns
git log -p | grep -E "(sk_|eyJ|AC[a-z0-9]{32}|SK[a-z0-9]{32})"
```

### Verify environment variables are set
```bash
# Frontend (Cloudflare Pages)
# Check in Cloudflare Dashboard → Pages → Settings → Environment Variables

# Backend (Render)
# Check in Render Dashboard → Service → Environment tab
```

### Test authentication
```bash
# Test Supabase auth
curl -X POST https://<project>.supabase.co/auth/v1/token \
  -H "apikey: <anon-key>" \
  -d '{"email":"test@example.com","password":"test"}'

# Test backend health
curl https://real-aidevelo-ai.onrender.com/health
```

