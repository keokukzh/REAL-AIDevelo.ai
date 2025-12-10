# Database Migration Guide

## Migrationen in Railway ausführen

### Option 1: Automatisch beim Start (Empfohlen)

Die Migrationen laufen automatisch, wenn Sie den `wait-and-migrate` Script als Start-Command verwenden:

1. In Railway: Gehen Sie zu Ihrem **REAL-AIDevelo.ai** Service
2. **Settings** Tab → **Deploy**
3. **Start Command** setzen zu:
   ```
   npm run wait-and-migrate && npm start
   ```

Dies wartet auf Postgres, führt alle Migrationen aus und startet dann den Server.

### Option 2: Manuell über Railway CLI

1. **Railway CLI installieren** (falls noch nicht installiert):
   ```bash
   npm install -g @railway/cli
   ```

2. **Einloggen**:
   ```bash
   railway login
   ```

3. **Projekt verbinden**:
   ```bash
   railway link
   ```

4. **Migrationen ausführen**:
   ```bash
   railway run npm run migrate
   ```

### Option 3: Manuell über One-Off Command in Railway Dashboard

1. In Railway: Gehen Sie zu Ihrem **REAL-AIDevelo.ai** Service
2. **Deployments** Tab
3. Klicken Sie auf **"..."** (drei Punkte) → **"Run Command"**
4. Geben Sie ein:
   ```
   npm run migrate
   ```
5. Klicken Sie auf **Run**

### Option 4: Direkt in Railway Shell

1. In Railway: Gehen Sie zu Ihrem **REAL-AIDevelo.ai** Service
2. **Deployments** Tab → **"..."** → **"Open Shell"**
3. Führen Sie aus:
   ```bash
   npm run migrate
   ```

## Verfügbare Migrationen

1. **001_create_users_table.sql** - Basis Users-Tabelle (Demo)
2. **002_create_agents_table.sql** - Voice Agents Tabelle
3. **003_create_purchases_table.sql** - Purchases Tabelle
4. **004_create_rag_documents_table.sql** - RAG Documents Tabelle
5. **005_create_call_history_table.sql** - Call History Tabelle

## Migration Status prüfen

Die Migrationen werden in der `schema_migrations` Tabelle gespeichert. Sie können den Status prüfen:

```sql
SELECT * FROM schema_migrations ORDER BY applied_at;
```

## Fehlerbehebung

### Migration schlägt fehl

1. **Prüfen Sie die Logs** in Railway
2. **Prüfen Sie die DATABASE_URL/DATABASE_PRIVATE_URL** Variable
3. **Prüfen Sie, ob Postgres online ist**
4. **Prüfen Sie die Verbindung**:
   ```bash
   railway run npm run migrate
   ```

### Migration bereits angewendet

Die Migrationen sind idempotent - sie können mehrfach ausgeführt werden. Bereits angewendete Migrationen werden übersprungen.

### Manuelle Migration zurücksetzen

Wenn Sie eine Migration zurücksetzen müssen:

```sql
DELETE FROM schema_migrations WHERE name = '002_create_agents_table.sql';
DROP TABLE IF EXISTS agents CASCADE;
```

**⚠️ Warnung**: Dies löscht alle Daten in der Tabelle!

## Nächste Schritte

Nach erfolgreichen Migrationen:
1. ✅ Prüfen Sie die Logs für "All migrations processed"
2. ✅ Testen Sie die API-Endpunkte
3. ✅ Erstellen Sie einen Test-Agent über die API
4. ✅ Prüfen Sie, ob Daten in der Datenbank gespeichert werden

