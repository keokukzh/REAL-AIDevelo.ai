# Environment Variables Deployment Map

## Overview

This document maps which environment variables go where for deployment.

**⚠️ IMPORTANT:** Never commit actual secrets to git. Only `.env.example` files are committed.

## Frontend: Cloudflare Pages

### Location
**Cloudflare Dashboard → Workers & Pages → Your Project → Settings → Environment Variables**

### Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://your-backend.onrender.com/api` |
| `VITE_SUPABASE_URL` | Supabase project URL (MUST be `https://<project-ref>.supabase.co`, NOT Render API URL) | `https://aidevelo-prod.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key (safe for browser) | `eyJhbGc...` |

### Setup Steps
1. Go to Cloudflare Dashboard
2. Navigate to your Pages project
3. Go to Settings → Environment Variables
4. Add each variable for **Production** and **Preview** environments
5. **Redeploy** after adding/changing variables (Vite builds variables into bundle)

### Notes
- ⚠️ Only `VITE_*` prefixed variables are available in the browser
- ⚠️ Never use `SUPABASE_SERVICE_ROLE_KEY` in frontend (server-only secret)
- ✅ `VITE_SUPABASE_ANON_KEY` is safe for browser exposure

---

## Backend: Render

### Location
**Render Dashboard → Your Service → Environment**

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port (usually auto-set by Render) | `10000` |
| `PUBLIC_BASE_URL` | Public HTTPS URL (for webhooks/OAuth) | `https://your-backend.onrender.com` |
| `SUPABASE_URL` | Supabase project URL (MUST be `https://<project-ref>.supabase.co`, NOT Render API URL) | `https://aidevelo-prod.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only!) | `eyJhbGc...` |
| `ELEVENLABS_API_KEY` | ElevenLabs API key | `...` |
| `ELEVENLABS_AGENT_ID_DEFAULT` | Default ElevenLabs agent ID | `...` |
| `TOOL_SHARED_SECRET` | Secret for tool webhooks | `long-random-string` |
| `GOOGLE_OAUTH_CLIENT_ID` | Google OAuth client ID | `...apps.googleusercontent.com` |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Google OAuth client secret | `...` |
| `GOOGLE_OAUTH_REDIRECT_URL` | Google OAuth redirect URL | `${PUBLIC_BASE_URL}/api/integrations/google/callback` |
| `TOKEN_ENCRYPTION_KEY` | Encryption key for refresh tokens (32+ chars) | `long-random-string-32-chars-min` |
| `WEB_ORIGIN` | Frontend origin (for CORS) | `https://aidevelo.ai` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `FRONTEND_URL` | Frontend URL (legacy, use WEB_ORIGIN) | `http://localhost:5173` |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | - |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | - |

### Setup Steps
1. Go to Render Dashboard
2. Navigate to your Web Service
3. Go to **Environment** tab
4. Add each variable
5. **Save** changes (service will restart automatically)

### Notes
- ⚠️ `SUPABASE_SERVICE_ROLE_KEY` is a secret - never expose to frontend
- ⚠️ `PUBLIC_BASE_URL` must be HTTPS (required for Twilio webhooks and Google OAuth)
- ✅ Render automatically sets `PORT` (usually 10000)

---

## Local Development

### Frontend: `.env.local` (Root Directory)

Create `.env.local` in project root (not committed):

```env
VITE_API_URL=http://localhost:5000/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Backend: `server/.env` (Server Directory)

Create `server/.env` (not committed):

```env
NODE_ENV=development
PORT=5000
PUBLIC_BASE_URL=https://xxxx-xx-xx-xx.ngrok-free.app
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ELEVENLABS_API_KEY=your-key
ELEVENLABS_AGENT_ID_DEFAULT=your-agent-id
TOOL_SHARED_SECRET=change-me-to-a-long-random-string
GOOGLE_OAUTH_CLIENT_ID=your-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret
GOOGLE_OAUTH_REDIRECT_URL=${PUBLIC_BASE_URL}/api/integrations/google/callback
TOKEN_ENCRYPTION_KEY=change-me-to-a-32plus-char-random-secret
WEB_ORIGIN=http://localhost:4000
```

### Notes
- Copy from `.env.example` / `server/.env.example` templates
- Fill in actual values (never commit these files)
- For local Twilio testing, use ngrok for `PUBLIC_BASE_URL`

---

## Quick Reference

### Where to Get Values

1. **Supabase Keys:**
   - Supabase Dashboard → Settings → API
   - `SUPABASE_URL`: Project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key (secret!)
   - `VITE_SUPABASE_ANON_KEY`: Anon/Public Key (safe for browser)

2. **ElevenLabs:**
   - ElevenLabs Dashboard → Profile → API Keys
   - `ELEVENLABS_API_KEY`: Your API key
   - `ELEVENLABS_AGENT_ID_DEFAULT`: Default agent ID

3. **Google OAuth:**
   - Google Cloud Console → APIs & Services → Credentials
   - `GOOGLE_OAUTH_CLIENT_ID`: OAuth 2.0 Client ID
   - `GOOGLE_OAUTH_CLIENT_SECRET`: Client Secret

4. **Twilio:**
   - Twilio Console → Account → API Keys & Tokens
   - `TWILIO_ACCOUNT_SID`: Account SID
   - `TWILIO_AUTH_TOKEN`: Auth Token

### Security Checklist

- ✅ Frontend only uses `VITE_*` variables
- ✅ `SUPABASE_SERVICE_ROLE_KEY` only in backend
- ✅ All secrets only in environment variables (never in code)
- ✅ `.env` and `.env.local` files in `.gitignore`
- ✅ Only `.env.example` files committed (no real values)
