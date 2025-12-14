# Render Environment Variables - Production Setup

## ✅ Korrekte DATABASE_URL für Render

```
postgresql://postgres:QPonMlqp8RAuw6GO@db.rckuwfcsqwwylffecwur.supabase.co:5432/postgres
```

## In Render setzen:

1. **Render Dashboard** → Service **real-aidevelo-ai**
2. **Environment** → **Add Environment Variable** (oder bestehende bearbeiten)
3. **Key:** `DATABASE_URL`
4. **Value:** `postgresql://postgres:QPonMlqp8RAuw6GO@db.rckuwfcsqwwylffecwur.supabase.co:5432/postgres`
5. **Save Changes**
6. Service wird automatisch neu gestartet

## ✅ Verifiziert

- ✅ Connection erfolgreich getestet
- ✅ PostgreSQL 17.6
- ✅ 8 Tabellen gefunden (agent_configs, call_logs, google_calendar_integrations, locations, organizations, etc.)

## Wichtig:

- ⚠️ **NIEMALS** diese URL in Git committen
- ✅ Nur in Render Environment Variables speichern
- ✅ Nach dem Setzen: Service wird automatisch neu gestartet
