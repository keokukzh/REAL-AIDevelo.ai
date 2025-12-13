# Dashboard Network Error Fix

**Date:** 2025-12-13  
**Problem:** Magic Link funktioniert, aber Dashboard zeigt "Network Error"  
**Status:** 🔍 DEBUGGING

---

## Problem

**Magic Link Flow:**
- ✅ Magic Link wird gesendet
- ✅ Link funktioniert (User kommt zum Dashboard)
- ❌ Dashboard API-Call schlägt fehl: "Network Error"

**TanStack Query zeigt:**
- `status: "error"`
- `fetchFailureCount: 2`
- `queryKey: ["dashboard", "overview"]`

---

## Mögliche Ursachen

### 1. Backend-Server läuft nicht richtig

**Problem:** Port 5000 ist offen, aber Server antwortet nicht auf HTTP-Requests.

**Lösung:**
1. Stoppe alle Node-Prozesse
2. Starte Backend neu:
   ```bash
   cd server
   npm run dev
   ```
3. Prüfe, dass Server-Logs zeigen: "Server is READY for requests"
4. Teste: `curl http://localhost:5000/api/health`

### 2. VITE_API_URL zeigt auf falsche URL

**Problem:** Frontend verwendet falsche API-URL.

**Lösung:**
1. Prüfe `.env.local` (Root):
   ```
   VITE_API_URL=http://localhost:5000/api
   ```
2. Hard Refresh Browser: `Ctrl + Shift + R`
3. Prüfe Browser Console → Network Tab → Welche URL wird verwendet?

### 3. CORS-Problem

**Problem:** Backend blockiert Requests vom Frontend.

**Lösung:**
1. Prüfe `server/src/app.ts` → CORS-Konfiguration
2. Stelle sicher, dass `http://localhost:4000` erlaubt ist
3. Prüfe Backend-Logs auf CORS-Fehler

### 4. Auth-Token fehlt oder ist ungültig

**Problem:** Dashboard-Endpoint benötigt Auth, aber Token fehlt.

**Lösung:**
1. Prüfe Browser Console → Network Tab
2. Prüfe Request Headers → Ist `Authorization: Bearer ...` vorhanden?
3. Prüfe Supabase Session → Ist User eingeloggt?

---

## Debugging-Schritte

### Schritt 1: Backend-Server prüfen

```bash
# Prüfe ob Server läuft
Test-NetConnection -ComputerName localhost -Port 5000

# Teste Health-Endpoint
curl http://localhost:5000/api/health

# Teste mit Auth-Token (falls verfügbar)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/dashboard/overview
```

### Schritt 2: Frontend API-URL prüfen

1. Öffne Browser Console (F12)
2. Gehe zu Console Tab
3. Führe aus:
   ```javascript
   console.log('API URL:', import.meta.env.VITE_API_URL);
   ```
4. Prüfe, ob URL korrekt ist: `http://localhost:5000/api`

### Schritt 3: Network Request prüfen

1. Öffne Browser DevTools → Network Tab
2. Lade Dashboard neu
3. Suche nach Request zu `/api/dashboard/overview`
4. Prüfe:
   - Request URL (vollständig)
   - Request Headers (Authorization vorhanden?)
   - Response Status Code
   - Response Body (Fehlermeldung?)

### Schritt 4: Backend-Logs prüfen

1. Öffne Terminal wo Backend läuft
2. Prüfe Logs auf:
   - Request kommt an?
   - Auth-Fehler?
   - CORS-Fehler?
   - Schema-Fehler?

---

## Erwartete Verhalten

**Wenn alles funktioniert:**

1. Magic Link → User klickt Link
2. Redirect zu `/auth/callback#access_token=...`
3. AuthCallbackPage verarbeitet Token
4. Redirect zu `/dashboard`
5. DashboardPage lädt → `useDashboardOverview()` wird aufgerufen
6. API-Call zu `http://localhost:5000/api/dashboard/overview`
7. Request Headers enthalten: `Authorization: Bearer <supabase-token>`
8. Backend antwortet mit 200 OK + Dashboard-Daten
9. Dashboard zeigt Daten an

**Wenn Fehler auftritt:**

- Network Tab zeigt fehlgeschlagenen Request
- Console zeigt Fehlermeldung
- Backend-Logs zeigen Fehlerursache

---

## Sofort-Lösung

**1. Backend neu starten:**

```bash
# Stoppe alle Node-Prozesse
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force

# Starte Backend neu
cd server
npm run dev
```

**2. Frontend neu starten:**

```bash
# Stoppe Frontend
# Starte neu
npm run dev
```

**3. Hard Refresh Browser:**

- `Ctrl + Shift + R`
- Oder: Incognito Window öffnen

**4. Prüfe:**

- Backend-Logs zeigen "Server is READY"?
- `http://localhost:5000/api/health` antwortet?
- Browser Console zeigt korrekte `VITE_API_URL`?

---

**Status:** Backend-Server muss neu gestartet werden. Prüfe Logs nach Start.

---

## Sofort-Lösung (Schritt-für-Schritt)

### 1. Backend-Server neu starten

```powershell
# Stoppe alle Node-Prozesse (vorsichtig!)
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force

# Gehe ins Server-Verzeichnis
cd server

# Starte Backend neu
npm run dev
```

**Warte auf diese Logs:**
```
[AIDevelo Server] Running on http://0.0.0.0:5000
[AIDevelo Server] ✅ Server is READY for requests
```

### 2. Prüfe Backend-Health-Endpoint

**In neuem Terminal:**
```powershell
curl http://localhost:5000/api/health
```

**Erwartung:** `{"ok":true,...}`

### 3. Prüfe Browser Console

**Öffne Browser DevTools (F12) → Console Tab**

**Führe aus:**
```javascript
console.log('API URL:', import.meta.env.VITE_API_URL);
```

**Erwartung:** `API URL: http://localhost:5000/api`

### 4. Prüfe Network Tab

**Browser DevTools → Network Tab**

1. Lade Dashboard neu (`Ctrl + Shift + R`)
2. Suche nach Request zu `/api/dashboard/overview`
3. Prüfe:
   - **Request URL:** `http://localhost:5000/api/dashboard/overview`
   - **Request Headers:** Enthält `Authorization: Bearer ...`?
   - **Response Status:** 200 OK oder Fehler?

### 5. Prüfe Backend-Logs

**Im Backend-Terminal prüfe:**
- Kommt Request an? → `GET /api/dashboard/overview`
- Gibt es Auth-Fehler? → `[SupabaseAuth] ...`
- Gibt es CORS-Fehler? → `[CORS] Rejected origin: ...`
- Gibt es Schema-Fehler? → `Missing tables: ...`

---

## Häufige Fehler & Lösungen

### Fehler 1: "Connection unexpectedly terminated"

**Ursache:** Backend-Server läuft nicht richtig oder crashed beim Start.

**Lösung:**
1. Prüfe Backend-Logs auf Fehler
2. Prüfe `server/.env` → Sind alle Variablen gesetzt?
3. Starte Backend neu

### Fehler 2: "CORS policy violation"

**Ursache:** Frontend-Origin ist nicht in `allowedOrigins`.

**Lösung:**
1. Prüfe Backend-Logs → Welche Origin wird rejected?
2. Prüfe `server/src/config/env.ts` → Ist `http://localhost:4000` in `allowedOrigins`?
3. Falls nicht: Füge hinzu oder setze `ALLOWED_ORIGINS` in `server/.env`

### Fehler 3: "Missing or invalid authorization header"

**Ursache:** Auth-Token fehlt oder ist ungültig.

**Lösung:**
1. Prüfe Browser Console → Ist Supabase Session vorhanden?
2. Prüfe Network Tab → Enthält Request `Authorization` Header?
3. Falls nicht: Logout → Login erneut

### Fehler 4: "Supabase schema not applied"

**Ursache:** Backend kann Tabellen nicht finden.

**Lösung:**
1. Prüfe Backend-Logs → Welche Tabellen fehlen?
2. Führe `server/db/schema.sql` in Supabase SQL Editor aus
3. Prüfe: `GET /api/db/preflight` → Sollte `{"ok":true}` zurückgeben

---

## Test-Checkliste

- [ ] Backend läuft (`npm run dev` in `server/`)
- [ ] Backend-Logs zeigen "Server is READY"
- [ ] `curl http://localhost:5000/api/health` → 200 OK
- [ ] Frontend läuft (`npm run dev` im Root)
- [ ] Browser Console zeigt korrekte `VITE_API_URL`
- [ ] Network Tab zeigt Request zu `/api/dashboard/overview`
- [ ] Request Headers enthalten `Authorization: Bearer ...`
- [ ] Backend-Logs zeigen Request ankommt
- [ ] Backend-Logs zeigen keine Fehler
- [ ] Dashboard lädt erfolgreich
