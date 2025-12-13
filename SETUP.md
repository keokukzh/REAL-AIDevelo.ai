# Setup-Anleitung für AIDevelo.ai

## Voraussetzungen

- Node.js 20 oder höher
- npm 9 oder höher
- ElevenLabs API-Schlüssel (optional für Voice-Funktionen)

## Schnellstart

### 1. Backend-Server starten

```bash
# In das server-Verzeichnis wechseln
cd server

# Dependencies installieren (falls noch nicht geschehen)
npm install

# .env Datei erstellen
# Kopiere server/.env.example zu server/.env und fülle die Werte aus
# Siehe "Umgebungsvariablen" Abschnitt unten für Details

# Server starten
npm run dev
```

Der Backend-Server läuft dann auf: `http://localhost:5000`

### 2. Frontend starten

```bash
# Im Root-Verzeichnis (falls nicht bereits dort)
cd ..

# Dependencies installieren (falls noch nicht geschehen)
npm install

# Optional: .env.local Datei erstellen
# Kopiere .env.example zu .env.local und fülle die Werte aus
# Siehe "Umgebungsvariablen" Abschnitt unten für Details

# Frontend starten
npm run dev
```

Das Frontend läuft dann auf: `http://localhost:3000` (oder dem Port, den Vite anzeigt)

## Umgebungsvariablen

### Frontend (.env.local im Root-Verzeichnis)

**WICHTIG:** Nur `VITE_*` Variablen sind im Browser verfügbar. Vite lädt `.env.local` automatisch.

```env
# Frontend -> API
VITE_API_URL=http://localhost:5000/api

# Supabase (Frontend verwendet NUR ANON Key - sicher für Browser)
# ⚠️ WARNUNG: Niemals SERVICE_ROLE_KEY ins Frontend - das ist ein Secret!
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your_supabase_anon_key>
```

**Setup:**
1. Kopiere `.env.example` zu `.env.local`
2. Fülle die Werte aus (Supabase URL und ANON Key)
3. `.env.local` wird NICHT committed (siehe `.gitignore`)

### Backend (server/.env)

**WICHTIG:** Alle Secrets gehören ins Backend, niemals ins Frontend!

```env
NODE_ENV=development
PORT=5000

# Public Base URL (für Twilio + Google OAuth Callback)
# Lokal: ngrok https URL, Production: Render/Railway URL
PUBLIC_BASE_URL=https://xxxx-xx-xx-xx.ngrok-free.app

# Supabase (server only - NIEMALS SERVICE_ROLE_KEY ins Frontend!)
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your_supabase_service_role_key>

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ElevenLabs
ELEVENLABS_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ELEVENLABS_AGENT_ID_DEFAULT=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ElevenLabs -> Tool Webhooks absichern
TOOL_SHARED_SECRET=change-me-to-a-long-random-string

# Google OAuth (Calendar)
GOOGLE_OAUTH_CLIENT_ID=xxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxx
GOOGLE_OAUTH_REDIRECT_URL=${PUBLIC_BASE_URL}/api/integrations/google/callback

# Refresh Token Encryption (32+ chars)
TOKEN_ENCRYPTION_KEY=change-me-to-a-32plus-char-random-secret

# CORS (deine Web-URL)
WEB_ORIGIN=http://localhost:5173
```

**Setup:**
1. Kopiere `server/.env.example` zu `server/.env`
2. Fülle alle Werte aus (Twilio, ElevenLabs, Google, Supabase)
3. `server/.env` wird NICHT committed (siehe `.gitignore`)

**Sicherheitshinweise:**
- ⚠️ **NIEMALS** `SUPABASE_SERVICE_ROLE_KEY` ins Frontend - das ist ein Secret!
- ⚠️ **NIEMALS** Twilio, ElevenLabs oder Google Secrets ins Frontend
- ✅ Frontend verwendet nur `VITE_SUPABASE_ANON_KEY` (sicher für Browser)
- ✅ Alle Secrets gehören ins Backend (`server/.env`)

## API-Endpunkte

Der Backend-Server stellt folgende API-Endpunkte bereit:

- `GET /api/health` - Health Check
- `GET /api/agents` - Liste aller Agents
- `POST /api/agents` - Neuen Agent erstellen
- `GET /api/elevenlabs/voices` - Verfügbare Stimmen
- `POST /api/elevenlabs/generate-speech` - Text zu Sprache
- `GET /api/calendar/:provider/auth` - Kalender OAuth URL
- `GET /api/calendar/:provider/callback` - Kalender OAuth Callback

## Weitere Dokumentation

- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Häufige Probleme und Lösungen
- **[docs/DEPLOY.md](docs/DEPLOY.md)** - Deployment-Anleitung für Frontend (Cloudflare Pages) und Backend (Render)

