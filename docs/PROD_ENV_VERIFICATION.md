# Production Environment Variables Verification

## Frontend (Cloudflare Pages)

### Required Environment Variables

1. **`VITE_SUPABASE_URL`**
   - Format: `https://<project-ref>.supabase.co`
   - Example: `https://rckuwfcsqwwylffecwur.supabase.co`
   - Used in: `src/lib/supabase.ts`
   - **Status**: ⚠️ Must be set in Cloudflare Pages → Settings → Environment Variables

2. **`VITE_SUPABASE_ANON_KEY`**
   - Format: JWT token (starts with `eyJ...`)
   - Used in: `src/lib/supabase.ts`
   - **Status**: ⚠️ Must be set in Cloudflare Pages → Settings → Environment Variables

3. **`RENDER_API_ORIGIN`** (Pages Function)
   - Format: `https://real-aidevelo-ai.onrender.com`
   - Used in: `functions/api/[[splat]].ts`
   - **Status**: ✅ Has fallback, but should be explicitly set

### Frontend API Base URL Resolution

- **Production**: Uses same-origin `/api` (proxied by Pages Function)
- **Code**: `src/services/apiBase.ts` (line 60)
- **Status**: ✅ Correctly configured

## Backend (Render)

### Required Environment Variables

1. **Supabase**
   - `SUPABASE_URL`: Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Service role key (bypasses RLS)

2. **Telephony**
   - `TWILIO_ACCOUNT_SID`: Twilio Account SID (starts with `AC...`)
   - `TWILIO_AUTH_TOKEN` OR (`TWILIO_API_KEY_SID` + `TWILIO_API_KEY_SECRET`)
   - `TWILIO_STREAM_TOKEN`: Secure random token for WebSocket auth

3. **ElevenLabs**
   - `ELEVENLABS_API_KEY`: API key (starts with `sk_...`)
   - `ELEVENLABS_AGENT_ID_DEFAULT`: Default agent ID for new tenants
   - `ELEVENLABS_WEBHOOK_SECRET`: Webhook verification secret

4. **URLs & Routing**
   - `PUBLIC_BASE_URL`: Backend public URL (e.g., `https://real-aidevelo-ai.onrender.com`)
   - `FRONTEND_URL`: Frontend URL (e.g., `https://aidevelo.ai`)
   - `FREESWITCH_WSS_URL`: FreeSWITCH WebSocket URL (e.g., `wss://freeswitch.aidevelo.ai`)

5. **Security**
   - `TOKEN_ENCRYPTION_KEY`: 32-byte base64 key for calendar token encryption
   - `TOOL_SHARED_SECRET`: Shared secret for tool webhooks

6. **Google OAuth** (for Calendar)
   - `GOOGLE_OAUTH_CLIENT_ID`: OAuth client ID
   - `GOOGLE_OAUTH_CLIENT_SECRET`: OAuth client secret
   - `GOOGLE_OAUTH_REDIRECT_URL`: OAuth redirect URL

### Backend Configuration

- **Code**: `server/src/config/env.ts`
- **Validation**: Enforces required vars in production
- **Status**: ⚠️ All vars must be set in Render → Environment tab

## Verification Checklist

### Frontend (Cloudflare Pages)
- [ ] `VITE_SUPABASE_URL` is set
- [ ] `VITE_SUPABASE_ANON_KEY` is set
- [ ] `RENDER_API_ORIGIN` is set (optional, has fallback)

### Backend (Render)
- [ ] `SUPABASE_URL` is set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set
- [ ] `PUBLIC_BASE_URL` is set (critical for webhooks)
- [ ] `FREESWITCH_WSS_URL` is set (or uses fallback)
- [ ] Twilio credentials are set (either Auth Token or API Keys)
- [ ] `ELEVENLABS_API_KEY` is set
- [ ] `ELEVENLABS_AGENT_ID_DEFAULT` is set
- [ ] `TOKEN_ENCRYPTION_KEY` is set (auto-generated if missing, but should be explicit)

## Testing

After setting all variables:

1. **Frontend**: Login should work (Supabase auth)
2. **Backend**: `/health` endpoint should return `{ ok: true }`
3. **Dashboard**: `/api/dashboard/overview` should return data (requires auth)
4. **Webhooks**: Twilio inbound calls should reach `/api/twilio/voice/inbound`

## Notes

- All secrets must be in environment variables only (never in git)
- `.env` files are gitignored
- After initial setup, rotate all keys for security

