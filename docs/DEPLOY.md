# Deployment Guide

Single source of truth for deploying AIDevelo.ai Frontend and Backend.

## Frontend: Cloudflare Pages

### Build Settings

- **Framework Preset**: Vite
- **Build Command**: `npm ci && npm run build`
- **Build Output Directory**: `dist`
- **Root Directory**: `/` (root of repo)

### SPA Routing

The `public/_redirects` file ensures React Router works:
```
/* /index.html 200
```

This prevents 404 errors when refreshing pages on Cloudflare Pages.

### Environment Variables (Cloudflare Pages)

Set these in **Cloudflare Dashboard → Workers & Pages → Your Project → Settings → Environment Variables**:

**Production:**
```
VITE_API_URL=https://your-backend.onrender.com/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Preview (for PR previews):**
Same variables, can use different values for testing.

**Important:**
- ⚠️ Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend (server-only secret)
- ✅ Only `VITE_` prefixed variables are available in client bundle
- ✅ After adding/changing variables, trigger a new deployment

### Deployment Methods

#### Option 1: Git Integration (Recommended)
1. Push code to GitHub
2. Connect repository to Cloudflare Pages
3. Configure build settings (see above)
4. Set environment variables
5. Automatic deployments on push to `main`

#### Option 2: Manual CLI Deployment
```bash
npm run build
wrangler pages deploy dist --project-name aidevelo-ai
```

### CORS Configuration

Backend must allow Cloudflare Pages origins:
- `https://aidevelo.ai` (production)
- `https://*.pages.dev` (Cloudflare Pages previews)
- `http://localhost:4000` (local dev)

Already configured in `server/src/app.ts` via `WEB_ORIGIN` and `allowedOrigins`.

---

## Backend: Render

### Service Configuration

- **Root Directory**: `server` ⚠️ IMPORTANT!
- **Environment**: `Node` (NOT Docker!)
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Plan**: Free tier available

### Environment Variables (Render)

Set these in **Render Dashboard → Your Service → Environment**:

**Required:**
```
NODE_ENV=production
PORT=10000
PUBLIC_BASE_URL=https://your-backend.onrender.com
```

**Supabase:**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Twilio:**
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**ElevenLabs:**
```
ELEVENLABS_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ELEVENLABS_AGENT_ID_DEFAULT=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TOOL_SHARED_SECRET=change-me-to-a-long-random-string
```

**Google OAuth:**
```
GOOGLE_OAUTH_CLIENT_ID=xxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxx
GOOGLE_OAUTH_REDIRECT_URL=https://your-backend.onrender.com/api/integrations/google/callback
```

**Other:**
```
TOKEN_ENCRYPTION_KEY=change-me-to-a-32plus-char-random-secret
WEB_ORIGIN=https://aidevelo.ai
```

**Important:**
- ⚠️ `PUBLIC_BASE_URL` must be HTTPS (required for Twilio webhooks and Google OAuth)
- ⚠️ `TOOL_SHARED_SECRET` and `TOKEN_ENCRYPTION_KEY` should be long random strings
- ✅ Render automatically sets `PORT` (usually 10000), but you can override

### Database (Supabase)

1. Create Supabase project at https://supabase.com
2. Get connection string from Supabase Dashboard → Settings → Database
3. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Render environment variables
4. Run migrations: The backend automatically runs migrations on startup (see `server/scripts/waitAndMigrate.ts`)

### Deployment Steps

1. **Create Render Account**: https://render.com (sign up with GitHub)
2. **Create Web Service**:
   - Click "New +" → "Web Service"
   - Connect GitHub repository: `REAL-AIDevelo.ai`
   - Select repository
3. **Configure Service**:
   - Name: `aidevelo-api` (or your choice)
   - Region: Choose nearest (e.g., Frankfurt)
   - Branch: `main`
   - Root Directory: `server` ⚠️ CRITICAL!
   - Environment: `Node` ⚠️ NOT Docker!
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
4. **Set Environment Variables**: Add all variables listed above
5. **Deploy**: Click "Create Web Service" and wait 2-3 minutes

### Post-Deployment

1. **Update Frontend**: Set `VITE_API_URL` in Cloudflare Pages to your Render backend URL
2. **Test Health Check**: `curl https://your-backend.onrender.com/health`
3. **Verify CORS**: Check that frontend can reach backend (no CORS errors)

---

## Environment Variables Summary

### Frontend (Cloudflare Pages)
- `VITE_API_URL` - Backend API URL
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key (safe for browser)

### Backend (Render)
- `PUBLIC_BASE_URL` - Public HTTPS URL (for webhooks/OAuth)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-only!)
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `ELEVENLABS_API_KEY` - ElevenLabs API key
- `ELEVENLABS_AGENT_ID_DEFAULT` - Default ElevenLabs agent ID
- `TOOL_SHARED_SECRET` - Secret for tool webhooks
- `GOOGLE_OAUTH_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_OAUTH_CLIENT_SECRET` - Google OAuth client secret
- `GOOGLE_OAUTH_REDIRECT_URL` - Google OAuth redirect URL
- `TOKEN_ENCRYPTION_KEY` - Encryption key for refresh tokens
- `WEB_ORIGIN` - Frontend origin (for CORS)

---

## Troubleshooting

### Frontend: Build Fails
- Check Node version (should be 20+)
- Verify `package.json` engines
- Check build logs in Cloudflare Pages dashboard

### Frontend: SPA Routing 404
- Ensure `public/_redirects` exists with `/* /index.html 200`
- Verify file is in `public/` directory (not `src/public/`)

### Frontend: Environment Variables Not Working
- Variables must start with `VITE_` to be available in client
- Rebuild after adding new variables
- Check browser console for undefined values

### Backend: Build Fails
- Verify Root Directory is set to `server`
- Check that `server/package.json` exists
- Review build logs in Render dashboard

### Backend: Service Won't Start
- Check that `PORT` environment variable is set (Render uses 10000)
- Verify all required environment variables are set
- Check startup logs for missing variables

### CORS Errors
- Verify backend `WEB_ORIGIN` includes frontend domain
- Check `allowedOrigins` in `server/src/config/env.ts`
- Ensure `Access-Control-Allow-Origin` header is present

---

## Additional Resources

- [SETUP.md](../SETUP.md) - Local development setup
- [TROUBLESHOOTING.md](../TROUBLESHOOTING.md) - Common issues and solutions
