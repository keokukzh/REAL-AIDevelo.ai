# 🚨 SOFORT FIX für https://aidevelo.ai/onboarding

## Problem:
- ✅ Frontend läuft auf Cloudflare Pages
- ❌ Backend läuft NICHT (keine API erreichbar)
- ❌ `VITE_API_URL` nicht gesetzt in Cloudflare

## Lösung (2 Optionen):

### Option 1: Render Backend deployen (5 Min) - EMPFOHLEN

1. **Render.com öffnen:** https://render.com
2. **New Web Service** → GitHub verbinden
3. **Settings:**
   - Root: `server`
   - Build: `npm install && npm run build`
   - Start: `npm start`
4. **Environment Variables:**
   ```
   DATABASE_URL=postgresql://postgres:jfH5dLfhBhdvQvIq@db.pdxdgfxhpyefqyouotat.supabase.co:5432/postgres
   NODE_ENV=production
   PORT=10000
   ```
5. **Deploy** → Warte 2-3 Min
6. **Backend URL kopieren:** `https://aidevelo-api-xxxx.onrender.com`
7. **Cloudflare Pages:** Settings → Environment Variables
   - `VITE_API_URL` = `https://aidevelo-api-xxxx.onrender.com/api`
8. **Redeploy Frontend**

### Option 2: Cloudflare Pages Environment Variable setzen

1. **Cloudflare Dashboard:** https://dash.cloudflare.com
2. **Workers & Pages** → Dein Projekt
3. **Settings** → **Environment Variables**
4. **Add Variable:**
   - Name: `VITE_API_URL`
   - Value: `https://deine-backend-url.com/api`
5. **Redeploy**

## ✅ Nach Fix:

- Frontend weiß wo Backend ist
- Agent Creation funktioniert
- Alle API Calls funktionieren

## ⚠️ WICHTIG:

**Ohne Backend funktioniert NICHTS!**
Du musst das Backend irgendwo deployen (Render, Fly.io, etc.)

