# Google OAuth Verifikation

## Server Status ✅

Der Server läuft erfolgreich auf Render:
- URL: `https://real-aidevelo-ai.onrender.com`
- Status: ✅ READY
- Environment: production

## Umgebungsvariablen Checkliste

Stelle sicher, dass folgende Variablen in Render gesetzt sind:

### Erforderlich:
- ✅ `GOOGLE_OAUTH_CLIENT_ID` - Deine Google OAuth Client ID
- ✅ `GOOGLE_OAUTH_CLIENT_SECRET` - Dein Google OAuth Client Secret  
- ✅ `PUBLIC_BASE_URL` - `https://real-aidevelo-ai.onrender.com`

### Optional (aber empfohlen):
- `FRONTEND_URL` - `https://aidevelo.ai` (für Frontend-Redirects)

## Google Cloud Console Konfiguration

### Autorisiere Weiterleitungs-URIs:
```
https://real-aidevelo-ai.onrender.com/api/calendar/google/callback
http://localhost:5000/api/calendar/google/callback
```

### Autorisiere JavaScript-Quellen:
```
https://aidevelo.ai
http://localhost:4000
```

## Test der OAuth-Konfiguration

### 1. Test Auth URL Endpoint

```bash
curl https://real-aidevelo-ai.onrender.com/api/calendar/google/auth
```

**Erwartete Antwort:**
```json
{
  "success": true,
  "data": {
    "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=https://real-aidevelo-ai.onrender.com/api/calendar/google/callback&...",
    "state": "google_..."
  }
}
```

**Wenn GOOGLE_OAUTH_CLIENT_ID nicht gesetzt ist:**
```json
{
  "success": true,
  "data": {
    "authUrl": "https://real-aidevelo-ai.onrender.com/api/calendar/google/callback?code=mock_code&state=...",
    "state": "google_..."
  }
}
```

### 2. Prüfe Redirect URI im Log

Wenn du die Auth URL aufrufst, sollte die `redirect_uri` Parameter sein:
```
redirect_uri=https://real-aidevelo-ai.onrender.com/api/calendar/google/callback
```

### 3. Vollständiger OAuth Flow Test

1. Öffne das Dashboard: `https://aidevelo.ai/dashboard`
2. Klicke auf "Kalender verbinden"
3. Du solltest zu Google weitergeleitet werden
4. Nach der Autorisierung wirst du zurück zum Backend redirectet
5. Das Backend sollte die Tokens erhalten und speichern

## Häufige Probleme

### Problem: "redirect_uri_mismatch"
**Lösung:** Stelle sicher, dass die exakte URI in Google Cloud Console eingetragen ist:
- `https://real-aidevelo-ai.onrender.com/api/calendar/google/callback`
- Keine Trailing Slashes
- Exakt wie im Code verwendet

### Problem: "invalid_client"
**Lösung:** 
- Prüfe, ob `GOOGLE_OAUTH_CLIENT_ID` korrekt gesetzt ist
- Prüfe, ob die Client ID in Google Cloud Console aktiv ist

### Problem: "invalid_grant"
**Lösung:**
- Der Authorization Code ist abgelaufen (nur 10 Minuten gültig)
- Versuche es erneut

## Debug-Logs

Wenn du Probleme hast, prüfe die Render-Logs auf:
- `[CalendarService] GOOGLE_OAUTH_CLIENT_ID not configured` - Client ID fehlt
- `Failed to exchange Google authorization code` - Token Exchange fehlgeschlagen
- `redirect_uri_mismatch` - URI stimmt nicht überein

## Nächste Schritte

1. ✅ Server läuft
2. ✅ Code ist deployed
3. ⏳ Teste den OAuth Flow im Dashboard
4. ⏳ Prüfe, ob Tokens korrekt gespeichert werden
