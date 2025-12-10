# Cloudflare Pages Setup - API URL konfigurieren

## ⚠️ WICHTIG: Environment Variable setzen

Das Frontend muss wissen, wo der Backend-Server läuft.

### Option 1: Environment Variable in Cloudflare Pages (Empfohlen)

1. **Cloudflare Dashboard öffnen**
2. **Pages** → Ihr Projekt (real-aidevelo-ai)
3. **Settings** → **Environment Variables**
4. **Add Variable:**
   - **Variable Name:** `VITE_API_URL`
   - **Value:** `https://real-aideveloai-production.up.railway.app/api`
   - **Environment:** Production (und Preview falls gewünscht)
5. **Save**
6. **Redeploy** das Frontend (automatisch oder manuell)

### Option 2: Automatische Erkennung (Bereits implementiert)

Der Code erkennt automatisch, ob Sie in Production sind:
- Wenn `hostname !== 'localhost'` → verwendet Railway URL
- Wenn `localhost` → verwendet lokalen Server

**ABER:** Für Cloudflare Pages sollten Sie trotzdem die Environment Variable setzen!

## CORS Konfiguration

Der Backend-Server erlaubt jetzt:
- ✅ `https://aidevelo.ai`
- ✅ `https://www.aidevelo.ai`
- ✅ `https://*.pages.dev` (Cloudflare Pages)
- ✅ `https://*.railway.app` (Railway Previews)

## Testen

Nach dem Setzen der Variable:
1. **Frontend neu deployen** (automatisch oder manuell)
2. **Agent erstellen** über Onboarding
3. **Sollte jetzt funktionieren!**

## Troubleshooting

### Immer noch Network Error?

1. **Prüfen Sie die Browser Console** (F12)
   - Welche URL wird verwendet?
   - Gibt es CORS-Fehler?

2. **Prüfen Sie Railway Logs**
   - REAL-AIDevelo.ai Service → Logs
   - Gibt es CORS-Fehler?

3. **Prüfen Sie die Environment Variable**
   - Cloudflare Pages → Settings → Environment Variables
   - Ist `VITE_API_URL` gesetzt?

4. **Hard Refresh im Browser**
   - `Ctrl + Shift + R` oder `Ctrl + F5`

