# Migrationen in Railway ausführen - EXAKTE ANLEITUNG

## ✅ Status-Check

Ich habe alle Migrationen geprüft:
- ✅ 5 Migration-Dateien vorhanden
- ✅ Alle SQL-Scripts sind korrekt
- ✅ Migration-Script ist konfiguriert
- ✅ Package.json enthält `npm run migrate` Command

## 🚀 SO FÜHREN SIE DIE MIGRATIONEN AUS:

### Schritt 1: Railway Dashboard öffnen
1. Gehen Sie zu https://railway.app
2. Öffnen Sie Ihr Projekt "positive-perception"
3. Klicken Sie auf **"REAL-AIDevelo.ai"** Service (NICHT Postgres!)

### Schritt 2: Command ausführen
1. Klicken Sie auf den Tab **"Deployments"**
2. Sie sehen eine Liste von Deployments
3. Klicken Sie auf die **drei Punkte "..."** rechts neben dem neuesten Deployment
4. Wählen Sie **"Run Command"**
5. Ein Dialog öffnet sich

### Schritt 3: Migration-Command eingeben
Im Command-Feld geben Sie **genau** ein:
```
npm run migrate
```

### Schritt 4: Ausführen
1. Klicken Sie auf **"Run"**
2. Warten Sie auf die Ausgabe

### Schritt 5: Erfolg prüfen
Sie sollten diese Ausgabe sehen:
```
[migrations] Using DATABASE_URL: postgresql://...
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

### Schritt 6: Tabellen prüfen
1. Gehen Sie zu **Postgres Service**
2. **Database Tab → Data Tab**
3. Sie sollten jetzt sehen:
   - `schema_migrations`
   - `users`
   - `agents`
   - `purchases`
   - `rag_documents`
   - `call_history`

## ⚠️ WICHTIGE HINWEISE:

1. **Führen Sie den Command im REAL-AIDevelo.ai Service aus**, nicht in Postgres!
2. **Warten Sie**, bis der Command vollständig durchgelaufen ist
3. **Prüfen Sie die Logs** auf Fehler
4. Die Migrationen sind **idempotent** - können mehrfach ausgeführt werden

## 🔧 Falls es nicht funktioniert:

### Fehler: "Command not found: npm"
- Stellen Sie sicher, dass Sie im **REAL-AIDevelo.ai Service** sind
- Nicht im Postgres Service!

### Fehler: "DATABASE_URL not set"
- Prüfen Sie die Variables im REAL-AIDevelo.ai Service
- `DATABASE_PRIVATE_URL` oder `DATABASE_URL` muss gesetzt sein

### Fehler: "Connection refused"
- Prüfen Sie, ob Postgres Service "Online" ist
- Warten Sie ein paar Sekunden und versuchen Sie es erneut

## 📊 Was wird erstellt:

1. **schema_migrations** - Tracking-Tabelle für Migrationen
2. **users** - Basis Users-Tabelle (Demo)
3. **agents** - Voice Agents (Haupttabelle mit JSONB)
4. **purchases** - Purchase Records
5. **rag_documents** - RAG Document Metadata
6. **call_history** - Call Tracking

Alle Tabellen haben:
- ✅ Indizes für Performance
- ✅ Foreign Keys für Datenintegrität
- ✅ Triggers für automatische Timestamps
- ✅ Constraints für Validierung

