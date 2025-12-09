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

# .env Datei erstellen/bearbeiten
# Mindestens diese Variablen setzen:
# ELEVENLABS_API_KEY=your_api_key_here
# NODE_ENV=development
# PORT=5000
# FRONTEND_URL=http://localhost:3000

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

# Optional: .env.local Datei erstellen für API-URL
# VITE_API_URL=http://localhost:5000/api

# Frontend starten
npm run dev
```

Das Frontend läuft dann auf: `http://localhost:3000` (oder dem Port, den Vite anzeigt)

## Umgebungsvariablen

### Backend (.env im server-Verzeichnis)

```env
# Erforderlich
NODE_ENV=development
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Optional
PORT=5000
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Für Payment (optional)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Für Kalender-Integration (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
OUTLOOK_CLIENT_ID=your_outlook_client_id
OUTLOOK_CLIENT_SECRET=your_outlook_client_secret
```

### Frontend (.env.local im Root-Verzeichnis)

```env
# Optional - Standard ist http://localhost:5000/api
VITE_API_URL=http://localhost:5000/api
```

## API-Endpunkte

Der Backend-Server stellt folgende API-Endpunkte bereit:

- `GET /api/health` - Health Check
- `GET /api/agents` - Liste aller Agents
- `POST /api/agents` - Neuen Agent erstellen
- `GET /api/elevenlabs/voices` - Verfügbare Stimmen
- `POST /api/elevenlabs/generate-speech` - Text zu Sprache
- `GET /api/calendar/:provider/auth` - Kalender OAuth URL
- `GET /api/calendar/:provider/callback` - Kalender OAuth Callback

## Troubleshooting

### Backend-Server nicht erreichbar

1. Prüfen Sie, ob der Server läuft:
   ```bash
   # Windows PowerShell
   Test-NetConnection -ComputerName localhost -Port 5000
   ```

2. Prüfen Sie die .env Datei im server-Verzeichnis

3. Starten Sie den Server neu:
   ```bash
   cd server
   npm run dev
   ```

### Frontend kann Backend nicht erreichen

1. Prüfen Sie die `VITE_API_URL` in `.env.local` (oder Standard: `http://localhost:5000/api`)

2. Prüfen Sie die Browser-Konsole auf Fehler

3. Stellen Sie sicher, dass beide Server laufen

### CORS-Fehler

Der Backend-Server erlaubt standardmäßig Anfragen von:
- `http://localhost:3000`
- `http://localhost:5173`

Falls Sie einen anderen Port verwenden, fügen Sie ihn zu `ALLOWED_ORIGINS` in der `.env` Datei hinzu.

## Produktions-Deployment

### Frontend (Cloudflare Pages)

Das Frontend wird automatisch auf Cloudflare Pages deployed, wenn zu `main` gepusht wird.

### Backend

Der Backend-Server benötigt eine persistente Umgebung (z.B. Docker, Railway, Render, Fly.io).

Siehe `DEPLOY.md` für detaillierte Anweisungen.

