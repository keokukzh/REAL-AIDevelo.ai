# Render Deployment Checklist

## Service Configuration

**Service Type:** Web Service  
**Name:** aidevelo-api  
**Environment:** Node  
**Root Directory:** `.` (repo root)  
**Build Command:** `cd server && npm ci && npm run build`  
**Start Command:** `cd server && npm start`  
**Health Check Path:** `/health`

## Required Environment Variables

Set these in Render Dashboard → Environment:

### Required (Production):
- `NODE_ENV=production`
- `SUPABASE_URL=https://<project-ref>.supabase.co` (NOT the Render API URL!)
- `SUPABASE_SERVICE_ROLE_KEY=<service-role-key>` (from Supabase Dashboard → Settings → API)
- `ELEVENLABS_API_KEY=<elevenlabs-api-key>`

### Optional:
- `PORT=5000` (default: 5000)
- `FRONTEND_URL=https://aidevelo.ai` (or your Cloudflare Pages URL)
- `PUBLIC_BASE_URL=https://real-aidevelo-ai.onrender.com` (your Render service URL)
- `ELEVENLABS_AGENT_ID_DEFAULT=<agent-id>` (optional)

### Future Features (Phase 2/3):
- `TWILIO_ACCOUNT_SID=<twilio-sid>`
- `TWILIO_AUTH_TOKEN=<twilio-token>`
- `GOOGLE_OAUTH_CLIENT_ID=<google-client-id>`
- `GOOGLE_OAUTH_CLIENT_SECRET=<google-client-secret>`
- `GOOGLE_OAUTH_REDIRECT_URL=https://real-aidevelo-ai.onrender.com/api/integrations/google/callback`
- `TOOL_SHARED_SECRET=<random-secret>`
- `TOKEN_ENCRYPTION_KEY=<32-char-key>`

## Common Mistakes

1. **Wrong SUPABASE_URL:** Must be `https://<project-ref>.supabase.co`, NOT `https://real-aidevelo-ai.onrender.com`
2. **Missing Root Directory:** Must be `.` (repo root), NOT `server/`
3. **Wrong Start Command:** Must be `cd server && npm start`, NOT `npm start` (needs to be in server dir)
4. **Health Check Path:** Must be `/health` (not `/api/health`)

## Verification

After deployment, test:
```bash
curl https://real-aidevelo-ai.onrender.com/health
# Expected: {"ok":true,"timestamp":"..."}

curl https://real-aidevelo-ai.onrender.com/api/health
# Expected: {"ok":true,"timestamp":"..."}
```

If 404:
1. Check Render logs for startup errors
2. Verify root directory is `.` (not `server/`)
3. Verify start command includes `cd server &&`
4. Check environment variables are set correctly

