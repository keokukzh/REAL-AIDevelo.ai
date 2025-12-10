# Railway Migration - Schritt für Schritt Anleitung

## ⚠️ WICHTIG: Tabellen NICHT manuell erstellen!

Die Tabellen werden automatisch durch Migrationen erstellt. Folgen Sie diesen Schritten:

## Schritt 1: Migrationen über Railway Dashboard ausführen

### Option A: Über "Run Command" (Empfohlen)

1. **Gehen Sie zu Ihrem REAL-AIDevelo.ai Service** (nicht Postgres!)
   - Klicken Sie auf "REAL-AIDevelo.ai" in der linken Sidebar

2. **Öffnen Sie den "Deployments" Tab**

3. **Klicken Sie auf die drei Punkte "..."** neben dem neuesten Deployment

4. **Wählen Sie "Run Command"**

5. **Geben Sie diesen Befehl ein:**
   ```
   npm run migrate
   ```

6. **Klicken Sie auf "Run"**

7. **Warten Sie auf die Ausgabe** - Sie sollten sehen:
   ```
   [migrations] Using DATABASE_URL: ...
   [migrations] Applying 001_create_users_table.sql...
   [migrations] Applied 001_create_users_table.sql
   [migrations] Applying 002_create_agents_table.sql...
   [migrations] Applied 002_create_agents_table.sql
   [migrations] Applying 003_create_purchases_table.sql...
   [migrations] Applied 003_create_purchases_table.sql
   [migrations] Applying 004_create_rag_documents_table.sql...
   [migrations] Applied 004_create_rag_documents_table.sql
   [migrations] Applying 005_create_call_history_table.sql...
   [migrations] Applied 005_create_call_history_table.sql
   [migrations] All migrations processed
   ```

## Schritt 2: Tabellen prüfen

1. **Gehen Sie zurück zu Postgres Service**
2. **Database Tab → Data Tab**
3. **Sie sollten jetzt 5 Tabellen sehen:**
   - `schema_migrations` (für Migration-Tracking)
   - `users`
   - `agents`
   - `purchases`
   - `rag_documents`
   - `call_history`

## Alternative: Migrationen automatisch beim Start ausführen

Wenn Sie möchten, dass Migrationen bei jedem Deployment automatisch laufen:

1. **REAL-AIDevelo.ai Service → Settings Tab → Deploy**
2. **Start Command ändern zu:**
   ```
   npm run wait-and-migrate && npm start
   ```
3. **Speichern** - Service wird neu deployed

## Was passiert bei den Migrationen?

Die Migrationen erstellen automatisch:
- ✅ Alle benötigten Tabellen
- ✅ Indizes für Performance
- ✅ Foreign Keys für Datenintegrität
- ✅ Triggers für automatische Timestamps
- ✅ Constraints für Datenvalidierung

## Fehlerbehebung

### "Command not found: npm"
- Stellen Sie sicher, dass Sie den Command im **REAL-AIDevelo.ai Service** ausführen, nicht in Postgres!

### "DATABASE_URL not set"
- Prüfen Sie, ob `DATABASE_PRIVATE_URL` oder `DATABASE_URL` in den Variables gesetzt ist
- Siehe: RAILWAY_SETUP.md

### "Connection refused"
- Prüfen Sie, ob Postgres Service "Online" ist
- Warten Sie ein paar Sekunden und versuchen Sie es erneut

## Wichtig: Nicht manuell Tabellen erstellen!

❌ **NICHT** die "Create table" UI in Railway verwenden
✅ **DOCH** die Migrationen über `npm run migrate` ausführen

Die Migrationen sind idempotent - sie können mehrfach ausgeführt werden ohne Probleme.

