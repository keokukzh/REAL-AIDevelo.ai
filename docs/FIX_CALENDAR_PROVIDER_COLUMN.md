# Fix: Calendar Provider Column Missing

## Problem

Der Fehler in den Render-Logs zeigt:
```
Could not find the 'provider' column of 'google_calendar_integrations' in the schema cache
```

Dies bedeutet, dass die `provider` Spalte in der `google_calendar_integrations` Tabelle fehlt.

## Lösung

Führe diese SQL-Migration in Supabase aus:

### Schritt 1: Öffne Supabase SQL Editor

1. Gehe zu [Supabase Dashboard](https://supabase.com/dashboard)
2. Wähle dein Projekt aus
3. Klicke auf **SQL Editor** im linken Menü
4. Klicke auf **New query**

### Schritt 2: Führe diese Migration aus

Kopiere und füge diesen SQL-Code ein:

```sql
-- Add provider column to google_calendar_integrations table
-- This allows support for multiple calendar providers (google, outlook, etc.)

-- Add provider column with default 'google' for existing rows
ALTER TABLE google_calendar_integrations
ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'google';

-- Drop the old unique constraint on location_id (if it exists as a unique constraint)
DO $$
BEGIN
  -- Check if unique constraint exists on location_id alone
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'google_calendar_integrations'::regclass 
    AND contype = 'u' 
    AND array_length(conkey, 1) = 1
    AND conkey[1] = (SELECT attnum FROM pg_attribute WHERE attrelid = 'google_calendar_integrations'::regclass AND attname = 'location_id')
  ) THEN
    -- Drop the old unique constraint
    ALTER TABLE google_calendar_integrations DROP CONSTRAINT google_calendar_integrations_location_id_key;
  END IF;
END $$;

-- Create unique index on (location_id, provider) to allow one integration per provider per location
CREATE UNIQUE INDEX IF NOT EXISTS idx_google_calendar_integrations_location_provider 
ON google_calendar_integrations(location_id, provider);

-- Add comment
COMMENT ON COLUMN google_calendar_integrations.provider IS 'Calendar provider: google, outlook, etc.';
```

### Schritt 3: Führe die Query aus

1. Klicke auf **Run** (oder drücke `Ctrl+Enter`)
2. Du solltest eine Erfolgsmeldung sehen: "Success. No rows returned"

### Schritt 4: Aktualisiere den PostgREST Schema-Cache ⚠️ WICHTIG!

**Dieser Schritt ist kritisch!** Nach Schema-Änderungen muss der PostgREST Schema-Cache aktualisiert werden, sonst tritt weiterhin der Fehler `PGRST204` auf.

Führe diese Query aus:

```sql
NOTIFY pgrst, 'reload schema';
```

Du solltest eine Erfolgsmeldung sehen. Dies teilt PostgREST mit, den Schema-Cache neu zu laden.

### Schritt 5: Überprüfe die Tabelle

Führe diese Query aus, um zu überprüfen, ob die Spalte hinzugefügt wurde:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'google_calendar_integrations'
ORDER BY ordinal_position;
```

Du solltest die `provider` Spalte in der Liste sehen.

### Schritt 6: Teste die Kalender-Verbindung

1. Gehe zu `https://aidevelo.ai/dashboard`
2. Klicke auf **Kalender verbinden**
3. Führe den Google OAuth-Flow durch
4. Die Verbindung sollte jetzt erfolgreich sein

## Environment Variables Überprüfung

Basierend auf deinen Screenshots sind die folgenden Variablen korrekt gesetzt:

✅ **Korrekt gesetzt:**
- `GOOGLE_OAUTH_CLIENT_ID`: `25592632245-1gt3pq1o9aqpk2ed551vco1fca4soq1v.apps.googleusercontent.com`
- `GOOGLE_OAUTH_CLIENT_SECRET`: `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`
- `TOKEN_ENCRYPTION_KEY`: `QwPF/geeFZULrs+fkluXmHttWHLgS4nYNwc3CPXemmM=`
- `FRONTEND_URL`: `https://aidevelo.ai`

⚠️ **Zu entfernen oder korrigieren:**
- `GOOGLE_OAUTH_REDIRECT_URI`: `https://aidevelo.ai` 
  - **Problem:** Diese Variable wird nicht vom Code verwendet und kann zu Verwirrung führen
  - **Lösung:** Entferne diese Variable aus Render Environment Variables
  - **Grund:** Der Code verwendet `PUBLIC_BASE_URL` für die Redirect URI, nicht diese Variable

## Google Cloud Console Überprüfung

Deine Google Cloud Console Konfiguration sieht korrekt aus:

✅ **Authorized Redirect URIs:**
- `https://real-aidevelo-ai.onrender.com/api/calendar/google/callback` ✅
- `http://localhost:5000/api/calendar/google/callback` ✅

✅ **Client ID und Secret** stimmen mit Render Environment Variables überein

## Nach der Migration

Nachdem du die Migration ausgeführt **UND** den Schema-Cache mit `NOTIFY pgrst, 'reload schema';` aktualisiert hast, sollte die Kalender-Verbindung funktionieren. Der Fehler `PGRST204: Could not find the 'provider' column` sollte verschwinden.

## Wichtig: Schema-Cache-Problem

Wenn du die Migration bereits ausgeführt hast, aber der Fehler weiterhin auftritt, liegt das daran, dass **PostgREST den Schema-Cache noch nicht aktualisiert hat**. 

**Lösung:** Führe einfach diese Query in Supabase SQL Editor aus:

```sql
NOTIFY pgrst, 'reload schema';
```

Dies aktualisiert den Schema-Cache sofort. Danach sollte die Kalender-Verbindung funktionieren.
