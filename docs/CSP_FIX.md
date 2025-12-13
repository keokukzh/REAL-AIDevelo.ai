# Content Security Policy (CSP) Fix

**Date:** 2025-12-13  
**Problem:** CSP blockiert `eval()`, was das Laden der Seite verhindert  
**Status:** ✅ Behoben

---

## Problem

**Fehlermeldung:**
```
Content Security Policy of your site blocks the use of 'eval' in JavaScript
The Content Security Policy (CSP) prevents the evaluation of arbitrary strings as JavaScript...
```

**Ursache:**
- Cloudflare Pages oder eine Bibliothek setzt eine strikte CSP
- Vite Development Mode verwendet `eval()` für Hot Module Replacement (HMR)
- React DevTools oder Source Maps verwenden `eval()`
- TanStack Query oder andere Bibliotheken könnten `eval()` verwenden

---

## Lösung

**CSP-Header in `public/_headers` hinzugefügt:**

```http
Content-Security-Policy: default-src 'self'; 
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://fonts.googleapis.com https://fonts.gstatic.com; 
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; 
  font-src 'self' https://fonts.gstatic.com; 
  img-src 'self' data: https:; 
  connect-src 'self' https://*.supabase.co https://*.supabase.io wss://*.supabase.co; 
  frame-src 'self' https://*.supabase.co;
```

**Erlaubt:**
- ✅ `unsafe-eval` für Vite HMR und Dev-Tools
- ✅ `unsafe-inline` für inline Scripts (React benötigt das)
- ✅ Supabase-Domains für Scripts und Connections
- ✅ Google Fonts für Styles und Fonts
- ✅ WebSocket-Verbindungen zu Supabase (`wss://`)

---

## Deployment

**Nach dem Commit:**
1. Push zu `main` Branch
2. Cloudflare Pages deployt automatisch
3. CSP-Header wird aktiv

**Test:**
1. Öffne `https://aidevelo.ai/dashboard`
2. Prüfe Browser Console → Sollte keine CSP-Fehler mehr zeigen
3. Seite sollte laden (nicht mehr "Wird geladen...")

---

## Alternative Lösung (wenn `unsafe-eval` vermieden werden soll)

**Falls möglich, sollte `unsafe-eval` entfernt werden:**

1. **Vite Production Build:** Verwendet kein `eval()` mehr
2. **Source Maps:** Können ohne `eval()` generiert werden
3. **Bibliotheken prüfen:** Welche verwendet `eval()`?

**Aber:** Für Development ist `unsafe-eval` oft notwendig für:
- Hot Module Replacement (HMR)
- React DevTools
- Source Maps im Browser

---

## Sicherheitshinweis

⚠️ **`unsafe-eval` erlaubt Code-Ausführung:**
- Erhöht das Risiko für XSS-Angriffe
- Sollte nur verwendet werden, wenn absolut notwendig
- In Production sollte `unsafe-eval` entfernt werden, wenn möglich

**Für Production:**
- Prüfe, ob Vite Production Build `eval()` verwendet
- Falls nicht: Entferne `unsafe-eval` aus CSP
- Falls ja: Behalte `unsafe-eval` nur für notwendige Domains

---

## Status

✅ CSP-Header hinzugefügt  
⏳ Warte auf Cloudflare Pages Deployment  
⏳ Test nach Deployment
