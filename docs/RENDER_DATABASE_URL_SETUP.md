# Render DATABASE_URL Setup

## Supabase Database Connection String für Render

### Format:
```
postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
```

### Für dein Projekt (rckuwfcsqwwylffecwur):
```
postgresql://postgres:[DEIN_PASSWORD]@db.rckuwfcsqwwylffecwur.supabase.co:5432/postgres
```

## So findest du dein Supabase Database Password:

### Option 1: Supabase Dashboard
1. Gehe zu: https://supabase.com/dashboard
2. Wähle Projekt: **rckuwfcsqwwylffecwur**
3. Gehe zu: **Settings** → **Database**
4. Unter **Connection string** → Wähle **URI**
5. Das Passwort steht im Connection String nach `postgres:`
6. Falls du das Passwort nicht siehst oder es geändert wurde:
   - Klicke auf **Reset database password**
   - Kopiere das neue Passwort

### Option 2: Connection Pooling (empfohlen für Production)
```
postgresql://postgres.rckuwfcsqwwylffecwur:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

## In Render setzen:

1. **Render Dashboard** → Service **real-aidevelo-ai**
2. **Environment** → **Add Environment Variable**
3. **Key:** `DATABASE_URL`
4. **Value:** `postgresql://postgres:[DEIN_PASSWORD]@db.rckuwfcsqwwylffecwur.supabase.co:5432/postgres`
5. **Save Changes**
6. Service wird automatisch neu gestartet

## Testen der Verbindung:

Lokal testen (mit korrektem Passwort):
```bash
cd server
node scripts/test_database_connection.js
```

## Wichtig:

- ⚠️ **NIEMALS** das Passwort in Git committen
- ✅ Verwende Environment Variables in Render
- ✅ Das Passwort sollte mindestens 12 Zeichen lang sein
- ✅ Nach dem Setzen in Render: Service neu deployen

## Alternative: Connection Pooling verwenden

Für bessere Performance in Production:
```
postgresql://postgres.rckuwfcsqwwylffecwur:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

Vorteile:
- Bessere Connection-Verwaltung
- Weniger Connection-Limits
- Optimiert für Production-Workloads
