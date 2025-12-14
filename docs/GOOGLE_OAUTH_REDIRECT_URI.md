# Google OAuth Redirect URI Konfiguration

## Korrekte Redirect URIs für Google Cloud Console

Die folgenden URIs müssen in der Google Cloud Console unter **"Autorisierte Weiterleitungs-URIs"** konfiguriert werden:

### Produktion:
```
https://real-aidevelo-ai.onrender.com/api/calendar/google/callback
```

### Lokale Entwicklung:
```
http://localhost:5000/api/calendar/google/callback
```

## Wichtige Hinweise

1. **Backend URL, nicht Frontend URL**: Der OAuth Callback geht an das Backend (`/api/calendar/google/callback`), nicht an das Frontend.

2. **PUBLIC_BASE_URL**: Die Backend-Umgebungsvariable `PUBLIC_BASE_URL` muss auf die Backend-URL gesetzt sein:
   - Produktion: `https://real-aidevelo-ai.onrender.com`
   - Lokal: `http://localhost:5000`

3. **Google Cloud Console**: 
   - Gehe zu: Google Cloud Console → APIs & Services → Credentials
   - Wähle deine OAuth 2.0 Client ID aus
   - Füge die oben genannten URIs zu "Autorisierte Weiterleitungs-URIs" hinzu
   - Speichere die Änderungen

4. **Änderungen können 5 Minuten bis mehrere Stunden dauern**, bis sie wirksam werden.

## Code-Implementierung

Der Code verwendet jetzt:
- `PUBLIC_BASE_URL` für die Backend-URL
- `/api/calendar/google/callback` als Callback-Endpoint
- Echte Google OAuth Token-Exchange (kein Mock mehr)

## Umgebungsvariablen in Render

Stelle sicher, dass folgende Variablen gesetzt sind:
- `GOOGLE_OAUTH_CLIENT_ID` - Deine Google OAuth Client ID
- `GOOGLE_OAUTH_CLIENT_SECRET` - Dein Google OAuth Client Secret
- `PUBLIC_BASE_URL` - Backend URL (z.B. `https://real-aidevelo-ai.onrender.com`)
