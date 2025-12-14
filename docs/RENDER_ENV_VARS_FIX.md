# Render Environment Variables - Complete Guide

**Date:** 2025-01-27  
**Status:** ✅ UPDATED - IPv6 Connection Issue Fixed

---

## Problem Identified

**Symptom:** `ENETUNREACH` Fehler beim Datenbankverbindungsversuch
```
connect ENETUNREACH 2a05:d018:135e:1658:f6ad:ee97:b554:b58c:5432
```

**Root Cause:** 
- `DATABASE_URL` verwendet direkte Supabase-Verbindung, die IPv6 zurückgibt
- Render kann IPv6-Adressen nicht erreichen
- **WICHTIG:** Neuer Code verwendet Supabase Client direkt - `DATABASE_URL` ist nur für Legacy-Routes

---

## Required Environment Variables for Render

### 1. SUPABASE_URL (REQUIRED)

**Key:** `SUPABASE_URL`  
**Value:** `https://rckuwfcsqwwylffecwur.supabase.co`  
**Type:** Plaintext

**Wichtig:**
- Muss mit `https://` beginnen
- Muss auf `.supabase.co` Domain zeigen (NICHT Render API URL!)
- Kein `/api` am Ende

---

### 2. SUPABASE_SERVICE_ROLE_KEY (REQUIRED)

**Key:** `SUPABASE_SERVICE_ROLE_KEY`  
**Value:** Dein Supabase Service Role Key  
**Type:** Secret (empfohlen)

**Wo findest du den Key:**
1. Supabase Dashboard → rckuwfcsqwwylffecwur
2. Settings → API
3. Kopiere "service_role" Key (NICHT "anon" Key!)

**Wichtig:**
- Das ist der SECRET Key (nur für Backend!)
- NIEMALS im Frontend verwenden
- NIEMALS in Git committen

---

### 3. DATABASE_URL (OPTIONAL - Legacy Only)

**Status:** ⚠️ OPTIONAL - Nur für Legacy-Routes

**WICHTIG:** 
- Neuer Code verwendet Supabase Client direkt (`supabaseDb.ts`)
- `DATABASE_URL` wird nur für alte Agent/Purchase-Routes benötigt
- **Empfehlung:** Lassen Sie `DATABASE_URL` leer, wenn Sie die Legacy-Routes nicht verwenden

**Falls gesetzt - Verwende Pooler-URL (IPv4-kompatibel):**

**Key:** `DATABASE_URL`  
**Value:** `postgresql://postgres.rckuwfcsqwwylffecwur:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`  
**Type:** Secret

**Format:**
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

**Warum Pooler-URL?**
- ✅ Unterstützt IPv4 (funktioniert mit Render)
- ✅ Bessere Connection-Verwaltung
- ✅ Weniger Connection-Limits
- ✅ Optimiert für Production

**Alternative (Direct Connection - kann IPv6-Probleme haben):**
```
postgresql://postgres:[PASSWORD]@db.rckuwfcsqwwylffecwur.supabase.co:5432/postgres
```

**So findest du das Passwort:**
1. Supabase Dashboard → rckuwfcsqwwylffecwur
2. Settings → Database
3. Connection string → URI
4. Passwort steht nach `postgres:`
5. Falls nicht sichtbar: "Reset database password" klicken

---

### 4. ELEVENLABS_API_KEY (REQUIRED)

**Key:** `ELEVENLABS_API_KEY`  
**Value:** Dein ElevenLabs API Key  
**Type:** Secret

---

### 5. ELEVENLABS_AGENT_ID_DEFAULT (OPTIONAL)

**Key:** `ELEVENLABS_AGENT_ID_DEFAULT`  
**Value:** Default ElevenLabs Agent ID  
**Type:** Plaintext

---

### 6. GOOGLE_OAUTH_CLIENT_ID (OPTIONAL)

**Key:** `GOOGLE_OAUTH_CLIENT_ID`  
**Value:** Google OAuth Client ID  
**Type:** Plaintext

**Hinweis:** Falls nicht gesetzt, wird Mock-Auth-URL zurückgegeben (für Testing)

---

### 7. GOOGLE_OAUTH_CLIENT_SECRET (OPTIONAL)

**Key:** `GOOGLE_OAUTH_CLIENT_SECRET`  
**Value:** Google OAuth Client Secret  
**Type:** Secret

---

### 8. PUBLIC_BASE_URL (REQUIRED)

**Key:** `PUBLIC_BASE_URL`  
**Value:** `https://real-aidevelo-ai.onrender.com`  
**Type:** Plaintext

**Wichtig:**
- Muss mit `https://` beginnen
- Muss die vollständige Render-URL sein (ohne `/api`)

---

## Setup in Render

### Schritt 1: Öffne Environment Variables

1. Render Dashboard → Services → **real-aidevelo-ai**
2. Klicke auf **Environment** Tab
3. Scrolle zu **Environment Variables**

### Schritt 2: Setze Required Variables

**Mindestens diese müssen gesetzt sein:**

1. ✅ `SUPABASE_URL` = `https://rckuwfcsqwwylffecwur.supabase.co`
2. ✅ `SUPABASE_SERVICE_ROLE_KEY` = [Dein Service Role Key]
3. ✅ `ELEVENLABS_API_KEY` = [Dein ElevenLabs Key]
4. ✅ `PUBLIC_BASE_URL` = `https://real-aidevelo-ai.onrender.com`

**Optional (nur wenn Legacy-Routes benötigt):**

5. ⚠️ `DATABASE_URL` = [Pooler-URL mit Passwort] (siehe oben)

### Schritt 3: Save & Redeploy

1. Klicke **Save Changes**
2. Render startet automatisch einen neuen Deployment
3. Prüfe Logs auf Verbindungsfehler

---

## Troubleshooting

### Problem: ENETUNREACH Fehler

**Symptom:**
```
connect ENETUNREACH 2a05:d018:135e:1658:f6ad:ee97:b554:b58c:5432
```

**Lösung:**
1. **Entferne `DATABASE_URL`** (wenn Legacy-Routes nicht benötigt)
   - Neuer Code verwendet Supabase Client direkt
   - `DATABASE_URL` ist optional

2. **ODER verwende Pooler-URL** (falls `DATABASE_URL` benötigt):
   - Verwende `pooler.supabase.com:6543` statt `db.*.supabase.co:5432`
   - Pooler unterstützt IPv4

### Problem: "Invalid API key" im Frontend

**Lösung:** Setze ENV-Variablen in **Cloudflare Pages** (nicht Render!)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Problem: Database Connection Timeout

**Lösung:**
1. Prüfe, ob `SUPABASE_URL` korrekt ist
2. Prüfe, ob `SUPABASE_SERVICE_ROLE_KEY` korrekt ist
3. Prüfe Supabase Dashboard → Settings → API für korrekte Werte

---

## Current Status (from Logs)

**Working:**
- ✅ Server startet erfolgreich
- ✅ API-Endpunkte funktionieren
- ✅ Supabase Client wird verwendet (neuer Code)

**Issues:**
- ⚠️ `DATABASE_URL` Verbindung schlägt fehl (IPv6-Problem)
- ⚠️ `GOOGLE_OAUTH_CLIENT_ID` nicht gesetzt (Mock-URL verwendet)

**Recommendation:**
- **Entferne `DATABASE_URL`** aus Render ENV-Variablen (wenn Legacy-Routes nicht benötigt)
- Der Server funktioniert ohne `DATABASE_URL` - neuer Code verwendet Supabase Client

---

## Verification

Nach dem Setzen der Variablen, prüfe die Logs:

**Erfolgreich:**
```
[Database] ℹ️  DATABASE_URL not set - using Supabase client directly (recommended)
[AIDevelo Server] ✅ Server is READY for requests
```

**Fehler:**
```
[Database] ❌ Connection test failed
[Database] ENETUNREACH
```

**Fix:** Entferne `DATABASE_URL` oder verwende Pooler-URL
