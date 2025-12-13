# Cloudflare Pages Environment Variables Setup

**Date:** 2025-12-13  
**Project:** real-aidevelo-ai

---

## Required Environment Variables

Du musst **genau diese 3 Variablen** in Cloudflare Pages setzen:

### 1. VITE_SUPABASE_URL
**Type:** Plaintext  
**Value:** `https://rckuwfcsqwwylffecwur.supabase.co`

**Wichtig:** 
- Muss mit `https://` beginnen
- Muss auf dein Supabase-Projekt zeigen (nicht auf Render!)
- Kein `/api` am Ende

### 2. VITE_SUPABASE_ANON_KEY
**Type:** Secret (empfohlen) oder Plaintext  
**Value:** Dein Supabase Anon Key (öffentlicher Key, sicher für Browser)

**Wo findest du den Key:**
1. Gehe zu Supabase Dashboard → aidevelo.prod
2. Settings → API
3. Kopiere "anon public" Key

**Wichtig:**
- Das ist der PUBLIC Key (sicher für Browser)
- NICHT der "service_role" Key (der ist geheim!)

### 3. VITE_API_URL
**Type:** Plaintext  
**Value:** `https://real-aidevelo-ai.onrender.com/api`

**Wichtig:**
- Muss mit `https://` beginnen
- Muss `/api` am Ende haben

---

## Setup in Cloudflare Pages

### Schritt 1: Öffne Settings
1. Gehe zu Cloudflare Dashboard
2. Workers & Pages → real-aidevelo-ai
3. Settings Tab
4. Scrolle zu "Build" → "Variables and Secrets"

### Schritt 2: Setze Variablen für Production

**WICHTIG:** Stelle sicher, dass die Variablen für **Production** gesetzt sind!

1. Klicke auf "Add variable"
2. Für jede Variable:
   - **Name:** `VITE_SUPABASE_URL`
   - **Value:** `https://rckuwfcsqwwylffecwur.supabase.co`
   - **Environment:** Wähle **Production** (oder "All environments")
   - **Type:** Plaintext
   - Save

3. Wiederhole für:
   - `VITE_SUPABASE_ANON_KEY` (Type: Secret empfohlen)
   - `VITE_API_URL`

### Schritt 3: Prüfe Environment

**KRITISCH:** Prüfe, dass die Variablen für **Production** aktiviert sind!

- In der Tabelle sollte "Production" bei jeder Variable angezeigt werden
- Falls nur "Preview" → Klicke auf die Variable → Edit → Wähle "Production"

---

## Nach dem Setzen

### 1. Trigger New Deployment
Nach dem Setzen/Ändern von Env Vars:
1. Gehe zu Deployments Tab
2. Klicke auf "Retry deployment" beim neuesten Deployment
3. ODER: Push neuen Commit → Auto-deploy triggert

### 2. Warte auf Deployment
- Warte bis Deployment "Published" ist (nicht nur Preview)
- Kann 2-5 Minuten dauern

### 3. Hard Refresh Browser
- Windows/Linux: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

### 4. Prüfe Console
Nach Hard Refresh sollte Console zeigen:
- ✅ Keine Fehler mehr
- ✅ Oder: `⚠️ Supabase not configured` (wenn Werte leer sind)

---

## Troubleshooting

### Problem: Variablen sind gesetzt, aber Fehler bleibt

**Lösung 1: Prüfe Environment**
- Variablen müssen für **Production** gesetzt sein
- Nicht nur für Preview!

**Lösung 2: Prüfe Werte**
- `VITE_SUPABASE_URL` muss vollständig sein: `https://rckuwfcsqwwylffecwur.supabase.co`
- Keine Leerzeichen am Anfang/Ende
- Kein `/api` am Ende

**Lösung 3: Redeploy**
- Nach Env Var Änderungen MUSS neu deployed werden
- Vite baut Env Vars zur Build-Zeit ein

**Lösung 4: Prüfe Supabase Key**
- Gehe zu Supabase Dashboard → Settings → API
- Kopiere "anon public" Key neu
- Stelle sicher, dass es der richtige Key ist (nicht service_role)

---

## Beispiel-Konfiguration

```
VITE_SUPABASE_URL=https://rckuwfcsqwwylffecwur.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (dein Key)
VITE_API_URL=https://real-aidevelo-ai.onrender.com/api
```

**Alle 3 müssen gesetzt sein!**

---

## Verifikation

Nach Setup und Deployment:

1. Öffne `https://aidevelo.ai`
2. Öffne Browser Console (F12)
3. **Erwartung:**
   - ✅ Keine Fehler über "Missing Supabase environment variables"
   - ✅ Seite lädt normal
   - ✅ Login funktioniert

**Falls weiterhin Fehler:**
- Prüfe, dass alle 3 Variablen für Production gesetzt sind
- Prüfe, dass Werte korrekt sind (keine Leerzeichen)
- Trigger neues Deployment
- Hard Refresh Browser

---

**Status:** Variablen müssen für Production gesetzt und neu deployed werden.
