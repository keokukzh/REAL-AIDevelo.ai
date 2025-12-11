# Supabase Client Option (Optional)

## Aktueller Status: ✅ Funktioniert!

Wir verwenden aktuell **direkte PostgreSQL-Verbindung** mit `pg`:
- ✅ Funktioniert perfekt
- ✅ Alle Tabellen erreichbar
- ✅ Migrations laufen
- ✅ Keine Änderungen nötig

## Supabase Client Alternative (Optional)

Falls du später Supabase-spezifische Features nutzen möchtest (Row Level Security, Realtime, etc.):

### Installation:
```bash
cd server
npm install @supabase/supabase-js
```

### Environment Variable hinzufügen:
```env
SUPABASE_URL=https://pdxdgfxhpyefqyouotat.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkeGRnZnhocHllZnF5b3VvdGF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NDUwODIsImV4cCI6MjA4MTAyMTA4Mn0.6gLVunUuwwB1ybBYJcdq0KFmZj8fOOMFHZuito056qs
```

### Code Beispiel:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pdxdgfxhpyefqyouotat.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// Beispiel: Daten abrufen
const { data, error } = await supabase
  .from('agents')
  .select('*')
```

## ⚠️ WICHTIG:

**Für jetzt: KEINE Änderungen nötig!**
- Direkte PostgreSQL-Verbindung funktioniert perfekt
- Alle Features laufen
- Deployment kann sofort starten

**Supabase Client nur wenn:**
- Du Row Level Security (RLS) brauchst
- Du Realtime Subscriptions willst
- Du Supabase Storage nutzen willst

## ✅ Nächster Schritt:

**Deploy Backend auf Render** - siehe `DEPLOY_BACKEND_RENDER.md`

Die aktuelle PostgreSQL-Verbindung ist ausreichend und funktioniert!

