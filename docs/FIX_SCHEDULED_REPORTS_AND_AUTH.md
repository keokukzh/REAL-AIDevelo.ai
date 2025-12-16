# Fix: Scheduled Reports & Calendar Auth Errors

## Problem 1: Scheduled Reports - Tabelle fehlt

**Fehler:**
```
Could not find the table 'public.scheduled_reports' in the schema cache
```

### Lösung A: Migration in Supabase ausführen (wenn Scheduled Reports benötigt werden)

1. **Supabase Dashboard öffnen:**
   - Gehe zu: https://supabase.com/dashboard
   - Wähle dein Projekt

2. **SQL Editor öffnen:**
   - Klicke auf "SQL Editor" im linken Menü
   - Klicke auf "+ New query"

3. **Migration ausführen:**
   - Kopiere den folgenden SQL-Code und füge ihn ein:

```sql
-- Migration: Create scheduled_reports table
CREATE TABLE IF NOT EXISTS scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  timezone TEXT NOT NULL DEFAULT 'Europe/Zurich',
  recipients TEXT[] NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}'::JSONB,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_location ON scheduled_reports(location_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next_run ON scheduled_reports(next_run_at) WHERE enabled = true;

-- Updated_at trigger (falls set_updated_at() Funktion existiert)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    DROP TRIGGER IF EXISTS trg_scheduled_reports_updated ON scheduled_reports;
    CREATE TRIGGER trg_scheduled_reports_updated
      BEFORE UPDATE ON scheduled_reports
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;
```

4. **Ausführen:**
   - Klicke auf "Run" (oder Strg+Enter)
   - Warte auf "Success"

### Lösung B: Scheduled Reports Feature deaktivieren (wenn nicht benötigt)

**In Render Environment Variables:**
```
ENABLE_SCHEDULED_REPORTS=false
```

---

## Problem 2: Calendar Auth - "User not authenticated"

**Fehler:**
```
GET /api/calendar/google/auth - 500
InternalServerError: User not authenticated
```

### Ursache:
Der Authorization Header wird nicht korrekt vom Frontend zum Backend weitergegeben.

### Lösung: Prüfe Cloudflare Pages Proxy

1. **Cloudflare Dashboard öffnen:**
   - Gehe zu: https://dash.cloudflare.com/
   - Wähle dein Projekt "real-aidevelo-ai"

2. **Environment Variables prüfen:**
   - Settings → Variables and Secrets
   - Stelle sicher, dass `RENDER_API_ORIGIN` gesetzt ist:
     ```
     RENDER_API_ORIGIN=https://real-aidevelo-ai.onrender.com
     ```

3. **Proxy-Funktion prüfen:**
   - Die Datei `functions/api/[[splat]].ts` sollte den Authorization Header weiterleiten
   - Stelle sicher, dass die Funktion deployed ist

### Alternative: Direkte Backend-URL testen

Falls der Proxy das Problem ist, kannst du temporär die Backend-URL direkt verwenden:

**In Cloudflare Pages Environment Variables:**
```
VITE_API_URL=https://real-aidevelo-ai.onrender.com/api
```

**WICHTIG:** Das sollte nur temporär sein, da es CORS-Probleme geben kann.

---

## Schnell-Checkliste

### Für Scheduled Reports:
- [ ] Option A: Migration in Supabase ausführen
- [ ] ODER Option B: `ENABLE_SCHEDULED_REPORTS=false` in Render setzen

### Für Calendar Auth:
- [ ] `RENDER_API_ORIGIN` in Cloudflare Pages gesetzt
- [ ] Authorization Header wird weitergegeben (Browser DevTools → Network → Headers prüfen)
- [ ] Supabase Session ist aktiv (Browser Console: `supabase.auth.getSession()`)

---

## Test nach Fix

1. **Scheduled Reports testen:**
   ```bash
   curl https://real-aidevelo-ai.onrender.com/api/reports/scheduled \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
   Sollte 200 OK zurückgeben (oder leeres Array `[]`)

2. **Calendar Auth testen:**
   - Öffne Dashboard: https://aidevelo.ai/dashboard
   - Klicke auf "Kalender verbinden"
   - Sollte zu Google OAuth weiterleiten (nicht 500 Error)

---

## Nächste Schritte

Nach dem Fix sollten beide Endpunkte funktionieren:
- ✅ `/api/reports/scheduled` - 200 OK
- ✅ `/api/calendar/google/auth` - 200 OK mit authUrl
