# Railway Database Setup - Fix Guide

## ⚠️ Problem: Database Connection lädt ewig

Die Datenbankverbindung in Railway funktioniert nicht. Hier ist die Lösung:

## ✅ Lösung: Environment Variables prüfen

### 1. Railway Variables prüfen

1. **REAL-AIDevelo.ai Service** → **Variables Tab**
2. **Prüfen Sie, ob gesetzt ist:**
   - `DATABASE_PRIVATE_URL` (WICHTIG für Railway!)
   - ODER `DATABASE_URL`

### 2. DATABASE_PRIVATE_URL setzen

**Option A: Automatisch von Railway**

Railway sollte automatisch `DATABASE_PRIVATE_URL` setzen, wenn:
- Postgres Service existiert
- Services im gleichen Projekt sind
- Private Networking aktiviert ist

**Option B: Manuell setzen**

1. **Postgres Service** → **Variables Tab**
2. **Suchen Sie nach:**
   - `PGHOST` → sollte `postgres.railway.internal` sein
   - `PGPORT` → sollte `5432` sein
   - `PGDATABASE` → Datenbankname
   - `PGUSER` → Benutzername
   - `PGPASSWORD` → Passwort

3. **Bauen Sie die URL:**
   ```
   postgresql://PGUSER:PGPASSWORD@postgres.railway.internal:5432/PGDATABASE
   ```

4. **REAL-AIDevelo.ai Service** → **Variables Tab**
5. **Add Variable:**
   - **Name:** `DATABASE_PRIVATE_URL`
   - **Value:** Die gebaute URL (siehe oben)
   - **Save**

### 3. DATABASE_URL als Fallback

Falls `DATABASE_PRIVATE_URL` nicht verfügbar ist:

1. **Postgres Service** → **Variables Tab**
2. **Suchen Sie nach:** `DATABASE_URL` oder `POSTGRES_URL`
3. **Kopieren Sie den Wert**
4. **REAL-AIDevelo.ai Service** → **Variables Tab**
5. **Add Variable:**
   - **Name:** `DATABASE_URL`
   - **Value:** Die kopierte URL
   - **Save**

## 🔍 Debugging

### Prüfen Sie die Logs

1. **REAL-AIDevelo.ai Service** → **Logs Tab**
2. **Suchen Sie nach:**
   ```
   [Database] Using database URL: ...
   [Database] Attempting to connect...
   [Database] ✅ Connected successfully
   ```

### Häufige Fehler:

#### "Connection timeout"
- **Fix:** `DATABASE_PRIVATE_URL` verwenden (nicht `DATABASE_URL` mit public endpoint)
- **Fix:** Connection Timeout erhöht auf 10s

#### "Connection refused"
- **Fix:** Prüfen Sie, ob Postgres Service "Online" ist
- **Fix:** Prüfen Sie, ob beide Services im gleichen Projekt sind

#### "Authentication failed"
- **Fix:** Prüfen Sie `PGUSER` und `PGPASSWORD` in Postgres Variables
- **Fix:** URL muss korrekt formatiert sein

## ✅ Nach dem Fix

1. **Service neu starten:**
   - REAL-AIDevelo.ai → Deployments → Restart

2. **Logs prüfen:**
   - Sollte sehen: `[Database] ✅ Connected successfully`
   - Sollte sehen: `[Database] ✅ All migrations completed`

3. **Postgres Database Tab prüfen:**
   - Sollte Tabellen zeigen (agents, users, etc.)
   - "Database Connection" sollte grün sein

## 📋 Checklist

- [ ] `DATABASE_PRIVATE_URL` ist gesetzt in REAL-AIDevelo.ai Service
- [ ] Postgres Service ist "Online"
- [ ] Beide Services im gleichen Projekt
- [ ] Private Networking aktiviert
- [ ] Service neu gestartet
- [ ] Logs zeigen erfolgreiche Verbindung
- [ ] Tabellen sind sichtbar in Postgres Database Tab

## 🚨 Wichtig

- **DATABASE_PRIVATE_URL** hat Priorität über `DATABASE_URL`
- Verwenden Sie **immer** `DATABASE_PRIVATE_URL` in Railway (schneller, sicherer)
- `DATABASE_URL` ist nur Fallback für externe Verbindungen

