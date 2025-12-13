# Cloudflare Pages Environment Variable Troubleshooting

**Date:** 2025-12-13  
**Problem:** Variablen sind gesetzt, Deployment getriggert, aber Console zeigt immer noch "Missing"

---

## Mögliche Ursachen

### 1. Variable-Wert ist leer oder hat Leerzeichen

**Problem:** Variable ist gesetzt, aber Value ist leer oder hat Leerzeichen am Anfang/Ende.

**Lösung:**
1. Gehe zu Cloudflare → Settings → Variables and Secrets
2. Klicke auf `VITE_SUPABASE_URL` → Edit
3. **Prüfe den Value:**
   - Muss vollständig sein: `https://rckuwfcsqwwylffecwur.supabase.co`
   - Keine Leerzeichen am Anfang/Ende
   - Kein `/api` am Ende
   - Keine Anführungszeichen
4. Falls leer → Setze den Wert neu
5. Save → Retry Deployment

### 2. Variable ist nur für Preview gesetzt

**Problem:** Variable ist gesetzt, aber nur für Preview, nicht für Production.

**Lösung:**
1. Gehe zu Cloudflare → Settings → Variables and Secrets
2. Stelle sicher, dass "Production" Environment ausgewählt ist (oben im Dropdown)
3. Prüfe jede Variable:
   - Muss "Production" oder "All environments" sein
   - Nicht nur "Preview"
4. Falls nur Preview → Edit → Wähle "Production" oder "All environments"
5. Retry Deployment

### 3. Build-Logs prüfen

**Problem:** Variablen werden während Build nicht gelesen.

**Lösung:**
1. Gehe zu Cloudflare → Deployments → Neuestes Deployment
2. Klicke auf Deployment → "View build logs"
3. Suche nach:
   - `VITE_SUPABASE_URL`
   - `Environment variables`
   - Build-Output
4. Prüfe, ob Variablen während Build verfügbar waren

### 4. Variable-Name hat Tippfehler

**Problem:** Variable heißt z.B. `VITE_SUPABASE_URL ` (mit Leerzeichen) oder `VITE_SUPABASE-URL` (mit Bindestrich).

**Lösung:**
1. Prüfe exakten Namen: Muss `VITE_SUPABASE_URL` sein (Großbuchstaben, Unterstriche)
2. Keine Leerzeichen
3. Keine Bindestriche
4. Exakt wie im Code verwendet

### 5. Cloudflare Cache-Problem

**Problem:** Cloudflare cached alte Builds.

**Lösung:**
1. Warte 5-10 Minuten nach Deployment
2. Hard Refresh Browser: `Ctrl + Shift + R`
3. Oder: Incognito/Private Window öffnen
4. Oder: Cloudflare Cache purgen (falls verfügbar)

---

## Debugging-Schritte

### Schritt 1: Prüfe Variable-Werte

1. Cloudflare → Settings → Variables and Secrets
2. Für jede Variable:
   - Klicke auf Variable → Edit
   - **Kopiere den Value** (vollständig!)
   - Prüfe:
     - `VITE_SUPABASE_URL` = `https://rckuwfcsqwwylffecwur.supabase.co` (vollständig, keine Leerzeichen)
     - `VITE_SUPABASE_ANON_KEY` = Dein Supabase Anon Key (vollständig)
     - `VITE_API_URL` = `https://real-aidevelo-ai.onrender.com/api`

### Schritt 2: Prüfe Environment

1. Stelle sicher, dass oben "Production" ausgewählt ist
2. Prüfe, dass jede Variable für "Production" aktiviert ist
3. Falls nicht → Edit → Wähle "Production"

### Schritt 3: Lösche und Setze Neu

**Manchmal hilft es, die Variable zu löschen und neu zu setzen:**

1. Cloudflare → Settings → Variables and Secrets
2. Klicke auf `VITE_SUPABASE_URL` → Delete
3. Warte 10 Sekunden
4. "Add variable" → Setze neu:
   - Name: `VITE_SUPABASE_URL`
   - Value: `https://rckuwfcsqwwylffecwur.supabase.co`
   - Environment: Production
   - Type: Plaintext
5. Save
6. Retry Deployment

### Schritt 4: Prüfe Build-Logs

1. Cloudflare → Deployments → Neuestes Deployment
2. Klicke auf Deployment → "View build logs"
3. Suche nach "VITE_SUPABASE_URL" in den Logs
4. Prüfe, ob der Wert während Build verfügbar war

### Schritt 5: Test mit leerem Commit

1. Erstelle leeren Commit:
   ```bash
   git commit --allow-empty -m "chore: test env vars deployment"
   git push origin main
   ```
2. Warte auf Deployment
3. Prüfe Console nach Hard Refresh

---

## Erwartete Werte

**Korrekte Konfiguration:**

```
VITE_SUPABASE_URL=https://rckuwfcsqwwylffecwur.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (dein Key)
VITE_API_URL=https://real-aidevelo-ai.onrender.com/api
```

**Alle müssen:**
- Für Production gesetzt sein
- Vollständige Werte haben (keine Leerzeichen)
- Korrekte Namen haben (exakt wie oben)

---

## Wenn nichts hilft

**Letzte Option: Prüfe Supabase Dashboard**

1. Gehe zu Supabase Dashboard → aidevelo.prod
2. Settings → API
3. Kopiere "anon public" Key neu
4. Gehe zu Cloudflare → Settings → Variables
5. Edit `VITE_SUPABASE_ANON_KEY`
6. Füge den Key neu ein (vollständig kopieren)
7. Save → Retry Deployment

**Oder: Kontaktiere Cloudflare Support**

Falls nach allen Schritten immer noch Fehler:
- Cloudflare Support kontaktieren
- Erwähne: "Environment variables not available during Vite build"
- Zeige Build-Logs

---

**Status:** Debugging-Schritte durchführen, besonders Variable-Werte prüfen!
