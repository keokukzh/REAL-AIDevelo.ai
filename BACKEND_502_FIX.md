# Backend 502 Error - Fix Guide

## Problem

Der Backend-Server antwortet mit **502 "Application failed to respond"**.

## Mögliche Ursachen:

1. **Server läuft nicht** - Railway Service ist gestoppt
2. **Server crashed** - Fehler beim Start
3. **Datenbank-Verbindung fehlt** - DATABASE_URL nicht gesetzt
4. **Port-Konflikt** - Falscher Port konfiguriert

## Lösungsschritte:

### 1. Railway Service Status prüfen

1. **Railway Dashboard** → **REAL-AIDevelo.ai Service**
2. **Prüfen Sie:**
   - Status: Sollte "Online" sein
   - Logs: Gibt es Fehler?
   - Deployments: Ist das neueste Deployment erfolgreich?

### 2. Service neu starten

1. **REAL-AIDevelo.ai Service** → **Deployments Tab**
2. **"..."** → **"Restart"**
3. **Warten** auf Neustart (1-2 Minuten)

### 3. Environment Variables prüfen

1. **REAL-AIDevelo.ai Service** → **Variables Tab**
2. **Prüfen Sie:**
   - `DATABASE_URL` oder `DATABASE_PRIVATE_URL` ist gesetzt
   - `NODE_ENV=production`
   - `PORT=5000` (oder was Railway vorgibt)
   - `ELEVENLABS_API_KEY` ist gesetzt (wenn benötigt)

### 4. Logs prüfen

1. **REAL-AIDevelo.ai Service** → **Logs Tab**
2. **Suchen Sie nach:**
   - `[AIDevelo Server] Running on...`
   - `[Database] ✅ Connected successfully`
   - `[Database] ✅ All migrations completed`
   - Fehler oder Crashes

### 5. Health Check testen

Nach dem Neustart:
```bash
curl https://real-aideveloai-production.up.railway.app/health
```

Sollte zurückgeben:
```json
{"status":"ok","timestamp":"..."}
```

## Wenn nichts hilft:

### Option 1: Neues Deployment

1. **GitHub** → Push einen kleinen Change
2. **Railway** → Sollte automatisch neu deployen
3. **Warten** auf erfolgreiches Deployment

### Option 2: Service komplett neu erstellen

1. **Railway** → Neuen Service erstellen
2. **GitHub Repo** verbinden
3. **Environment Variables** kopieren
4. **Deploy**

## Debugging Commands:

### Lokal testen (falls möglich):

```bash
cd server
npm run build
npm start
```

Dann testen:
```bash
curl http://localhost:5000/health
```

## Häufige Fehler:

### "Cannot connect to database"
- **Fix:** `DATABASE_PRIVATE_URL` oder `DATABASE_URL` setzen

### "Port already in use"
- **Fix:** Railway setzt `PORT` automatisch, nicht überschreiben

### "Migration failed"
- **Fix:** Prüfen Sie Logs, Migrationen sollten automatisch laufen

## Status prüfen:

Nach dem Fix sollten Sie sehen:
- ✅ Service Status: "Online"
- ✅ Health Check: `{"status":"ok"}`
- ✅ Logs: Server läuft ohne Fehler
- ✅ API Requests funktionieren

