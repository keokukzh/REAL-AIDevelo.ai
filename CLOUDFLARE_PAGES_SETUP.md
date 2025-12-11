# Cloudflare Pages - VITE_API_URL setzen

## SOFORT FIX für Live-Seite:

1. **Gehe zu Cloudflare Dashboard:**
   - https://dash.cloudflare.com
   - Workers & Pages → Dein Projekt

2. **Settings → Environment Variables:**
   - Klicke "Add variable"
   - **Name:** `VITE_API_URL`
   - **Value:** `https://aidevelo-api.onrender.com/api` (nach Render Deploy)
   - Oder temporär: `http://localhost:5000/api` (für Testing)

3. **Redeploy:**
   - Klicke "Retry deployment" oder push zu main branch

4. **Testen:**
   - Öffne https://aidevelo.ai/onboarding
   - Versuche Agent zu erstellen

## Alternative: Backend auf Render deployen

Siehe `RENDER_DEPLOY_NOW.md` für Schritt-für-Schritt Anleitung.

## WICHTIG:

Das Frontend braucht `VITE_API_URL` um zu wissen wo das Backend ist!
Ohne diese Variable verwendet es `window.location.origin + '/api'` was nicht funktioniert!

