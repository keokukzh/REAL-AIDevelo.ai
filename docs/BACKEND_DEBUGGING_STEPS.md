# Backend Debugging Steps

**Date:** 2025-12-13  
**Status:** 🔍 Backend läuft, aber HTTP-Requests schlagen fehl

---

## Aktueller Status

### ✅ Backend-Server läuft
- **Port:** 5000 ✅ (mehrere Listen-Sockets aktiv)
- **Status:** `✅ Server is READY for requests`
- **Process IDs:** 26588, 23808, 253232

### ❌ HTTP-Requests schlagen fehl
- **Health-Check:** `Connection unexpectedly terminated`
- **curl:** Status 000 (Timeout/Connection failed)
- **PowerShell Invoke-WebRequest:** Connection closed

---

## Problem-Analyse

**Mögliche Ursachen:**

1. **Server crashed nach Start** (aber Port noch offen)
2. **Express-App nicht richtig initialisiert**
3. **Middleware blockiert Requests**
4. **Netzwerk-Problem (Firewall, Proxy)**

---

## Debugging-Schritte

### Schritt 1: Prüfe ob Server wirklich läuft

```powershell
# Prüfe Backend-Logs
Get-Content "C:\Users\Aidevelo\.cursor\projects\c-Users-Aidevelo-Desktop-REAL-AIDevelo-ai\terminals\3081.txt" -Tail 50

# Prüfe ob Process noch läuft
Get-Process -Id 253232 -ErrorAction SilentlyContinue
```

### Schritt 2: Teste direkt im Browser

**Öffne Browser:**
1. Gehe zu: `http://localhost:5000/api/health`
2. Erwartung: `{"ok":true,...}` oder Fehlerseite

**Wenn Fehler:**
- Screenshot der Fehlerseite
- Browser Console (F12) → Fehlermeldungen?

### Schritt 3: Teste Dashboard-Endpoint

**Im Browser:**
1. Öffne: `http://localhost:4000/dashboard`
2. Öffne DevTools (F12) → Network Tab
3. Lade Seite neu (`Ctrl + Shift + R`)
4. Suche nach Request zu `/api/dashboard/overview`
5. Prüfe:
   - **Request URL:** Vollständige URL?
   - **Request Headers:** Enthält `Authorization: Bearer ...`?
   - **Response Status:** 200 OK oder Fehler?
   - **Response Body:** Fehlermeldung?

### Schritt 4: Prüfe Backend-Logs für Dashboard-Request

**Im Backend-Terminal:**
- Kommt Request an? → `GET /api/dashboard/overview`
- Gibt es Auth-Fehler? → `[SupabaseAuth] ...`
- Gibt es CORS-Fehler? → `[CORS] Rejected origin: ...`
- Gibt es Schema-Fehler? → `Missing tables: ...`

---

## Erwartetes Verhalten

**Wenn alles funktioniert:**

1. Browser → `http://localhost:5000/api/health` → `{"ok":true}`
2. Browser → `http://localhost:4000/dashboard`
3. Frontend macht Request zu `http://localhost:5000/api/dashboard/overview`
4. Request Headers enthalten: `Authorization: Bearer <supabase-token>`
5. Backend-Logs zeigen: `GET /api/dashboard/overview`
6. Backend antwortet mit 200 OK + Dashboard-Daten
7. Dashboard zeigt Daten an

**Wenn Fehler auftritt:**

- Backend-Logs zeigen Fehlerursache
- Browser Console zeigt Fehlermeldung
- Network Tab zeigt fehlgeschlagenen Request

---

## Sofort-Lösung

**1. Backend neu starten:**

```powershell
# Stoppe alle Node-Prozesse
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force

# Starte Backend neu
cd server
npm run dev
```

**2. Warte auf Logs:**
```
[AIDevelo Server] ✅ Server is READY for requests
```

**3. Teste Health-Endpoint im Browser:**
```
http://localhost:5000/api/health
```

**4. Teste Dashboard:**
```
http://localhost:4000/dashboard
```

---

## Nächste Schritte

1. ✅ Backend läuft (Port 5000 offen)
2. ⏳ Browser-Test: `http://localhost:5000/api/health`
3. ⏳ Dashboard-Test: `http://localhost:4000/dashboard`
4. ⏳ Backend-Logs prüfen für Dashboard-Request
