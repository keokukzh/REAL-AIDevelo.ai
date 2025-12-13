# Troubleshooting Guide

## Backend-Server nicht erreichbar

1. Prüfen Sie, ob der Server läuft:
   ```bash
   # Windows PowerShell
   Test-NetConnection -ComputerName localhost -Port 5000
   ```

2. Prüfen Sie die .env Datei im server-Verzeichnis
   - Stelle sicher, dass `server/.env` existiert (kopiert von `server/.env.example`)
   - Prüfe dass alle erforderlichen Variablen gesetzt sind

3. Starten Sie den Server neu:
   ```bash
   cd server
   npm run dev
   ```

4. Prüfe die Server-Logs auf Fehler:
   - Fehlende Environment-Variablen werden beim Start geloggt
   - Database-Verbindungsfehler werden angezeigt

## Frontend kann Backend nicht erreichen

1. Prüfen Sie die `VITE_API_URL` in `.env.local`:
   - Standard: `http://localhost:5000/api`
   - Stelle sicher, dass die Datei existiert (kopiert von `.env.example`)

2. Prüfen Sie die Browser-Konsole auf Fehler:
   - CORS-Fehler deuten auf Backend-Konfiguration hin
   - 404-Fehler deuten auf falsche API-URL hin

3. Stellen Sie sicher, dass beide Server laufen:
   - Backend: `http://localhost:5000`
   - Frontend: `http://localhost:4000` (oder Port den Vite anzeigt)

4. Prüfe Network-Tab im Browser:
   - API-Requests sollten zu `http://localhost:5000/api` gehen
   - Keine Requests zu `127.0.0.1` oder falschen Ports

## CORS-Fehler

Der Backend-Server erlaubt standardmäßig Anfragen von:
- `http://localhost:3000`
- `http://localhost:4000`
- `http://localhost:5173`

Falls Sie einen anderen Port verwenden:
1. Fügen Sie ihn zu `WEB_ORIGIN` in `server/.env` hinzu
2. Oder setzen Sie `ALLOWED_ORIGINS` (komma-separiert)

## Environment-Variablen Probleme

### Frontend: VITE_* Variablen nicht verfügbar

- **Problem**: `import.meta.env.VITE_API_URL` ist `undefined`
- **Lösung**:
  1. Stelle sicher, dass Variable mit `VITE_` beginnt
  2. Prüfe dass `.env.local` existiert
  3. Starte Dev-Server neu (`npm run dev`)
  4. In Production: Setze Variable im Hosting-Provider (Cloudflare Pages)

### Backend: Environment-Variablen nicht geladen

- **Problem**: `process.env.ELEVENLABS_API_KEY` ist `undefined`
- **Lösung**:
  1. Prüfe dass `server/.env` existiert (nicht `.env.example`)
  2. Stelle sicher, dass `dotenv` korrekt lädt (siehe `server/src/config/env.ts`)
  3. Starte Server neu

## Database-Verbindungsfehler

- **Problem**: `DATABASE_URL not set` oder Connection-Fehler
- **Lösung**:
  1. Setze `DATABASE_URL` in `server/.env` (Supabase Connection String)
  2. Format: `postgresql://postgres:password@host:5432/postgres`
  3. Prüfe dass Supabase-Projekt aktiv ist
  4. Für lokale Entwicklung optional (nur für Agent/Purchase-Features benötigt)

## Build-Fehler

### Frontend Build schlägt fehl

1. Prüfe Node-Version: `node --version` (sollte 20+ sein)
2. Lösche `node_modules` und `package-lock.json`:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
3. Prüfe TypeScript-Fehler: `npm run typecheck`

### Backend Build schlägt fehl

1. Gehe ins `server/` Verzeichnis
2. Prüfe TypeScript-Fehler: `cd server && npx tsc --noEmit`
3. Prüfe dass alle Dependencies installiert sind: `npm install`

## Production-Deployment Probleme

Siehe [docs/DEPLOY.md](docs/DEPLOY.md) für detaillierte Deployment-Troubleshooting.
