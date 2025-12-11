# Supabase Verbindung - Konfiguration

## ✅ Supabase Credentials

- **Project URL:** https://pdxdgfxhpyefqyouotat.supabase.co
- **Project Ref:** pdxdgfxhpyefqyouotat
- **Database Password:** jfH5dLfhBhdvQvIq
- **API Key:** eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkeGRnZnhocHllZnF5b3VvdGF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NDUwODIsImV4cCI6MjA4MTAyMTA4Mn0.6gLVunUuwwB1ybBYJcdq0KFmZj8fOOMFHZuito056qs

## 🔗 Connection Strings

### ✅ Direct Connection (Port 5432) - GETESTET & FUNKTIONIERT
```
postgresql://postgres:jfH5dLfhBhdvQvIq@db.pdxdgfxhpyefqyouotat.supabase.co:5432/postgres
```

**✅ Diese Verbindung wurde erfolgreich getestet!**

### Option 2: Pooled Connection (Port 6543) - Optional
Falls die direkte Verbindung Probleme macht, kannst du später die Pooled Connection versuchen.
Prüfe die korrekte URL in Supabase Dashboard → Settings → Database → Connection Pooling

## 📝 Environment Variables Setup

### Für Railway (Production):

1. Gehe zu Railway Dashboard → Dein Service → **Variables**
2. **Lösche** `DATABASE_PRIVATE_URL` (nicht mehr benötigt)
3. **Setze/Update** `DATABASE_URL` mit einem der obigen Connection Strings
4. **Empfohlen:** Verwende den Pooled Connection String (Port 6543)
5. **Speichern** - Railway wird automatisch neu deployen

### Für Local Development:

1. Öffne `server/.env` Datei
2. Füge/Update hinzu:
   ```env
   DATABASE_URL=postgresql://postgres:jfH5dLfhBhdvQvIq@db.pdxdgfxhpyefqyouotat.supabase.co:5432/postgres
   ```
3. Speichere die Datei

## 🚀 Nächste Schritte

1. ✅ Connection String in Railway/Local setzen
2. ✅ Server starten und Logs prüfen
3. ✅ Migrations ausführen: `cd server && npm run migrate`
4. ✅ Test: Agent erstellen im Dashboard

## 🔍 Connection Test

Der Server wird automatisch:
- ✅ Supabase erkennen
- ✅ SSL korrekt konfigurieren
- ✅ Connection Pooling nutzen
- ✅ Retry-Logik mit Exponential Backoff verwenden

## ⚠️ Troubleshooting

**Connection Timeout?**
- Verwende Pooled Connection (Port 6543) statt Direct (Port 5432)
- Prüfe Supabase Dashboard → Settings → Database → Connection Pooling

**SSL Error?**
- Code konfiguriert SSL automatisch
- Wenn Probleme: Prüfe Supabase SSL Settings

**Password Error?**
- Stelle sicher, dass das Password korrekt ist: `jfH5dLfhBhdvQvIq`
- Keine Leerzeichen am Anfang/Ende

