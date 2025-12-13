# ✅ Cloudflare Pages - Backend URL aktualisieren

## Backend läuft jetzt auf Render:
**URL:** `https://real-aidevelo-ai.onrender.com`

## SOFORT FIX für Cloudflare Pages:

1. **Gehe zu Cloudflare Dashboard:**
   - https://dash.cloudflare.com
   - Workers & Pages → Dein Projekt (`real-aidevelo-ai`)

2. **Settings → Environment Variables:**
   - Suche nach `VITE_API_URL`
   - Falls vorhanden: **Edit**
   - Falls nicht: **Add variable**
   - **Name:** `VITE_API_URL`
   - **Value:** `https://real-aidevelo-ai.onrender.com/api`
   - **Environment:** Production + Preview
   - **Save**

3. **Redeploy:**
   - Gehe zu "Deployments"
   - Klicke "Retry deployment" auf dem neuesten Deployment
   - Oder: Push zu main branch triggert automatisch neuen Deploy

4. **Testen:**
   - Öffne https://aidevelo.ai/onboarding
   - Versuche Agent zu erstellen
   - Prüfe Browser Console (F12) für Fehler

## ✅ Nach Update:

- Frontend weiß wo Backend ist
- Agent Creation funktioniert
- Alle API Calls funktionieren

## 🧪 Backend Test:

```bash
# Health Check
curl https://real-aidevelo-ai.onrender.com/health

# API Test
curl https://real-aidevelo-ai.onrender.com/api/v1/agents
```

