# Multichannel Same Brain - QA Guide

## Übersicht
Dieses Dokument beschreibt die manuelle QA für das Multichannel Feature (Webchat + WhatsApp), das denselben AgentCore wie der Voice-Agent nutzt.

## Voraussetzungen

### Datenbank
1. Migration ausführen: `server/db/migrations/019_create_multichannel_tables.sql`
   - In Supabase SQL Editor ausführen oder via Migration-Script

### Umgebungsvariablen
- `TWILIO_AUTH_TOKEN` (für WhatsApp Webhook Signature Validation)
- `PUBLIC_BASE_URL` (für korrekte Webhook-URL)

### Twilio Setup
- WhatsApp Business API aktiviert
- WhatsApp-Nummer konfiguriert
- Inbound Webhook auf `POST /api/twilio/whatsapp/inbound` gesetzt

## Test-Szenarien

### 1. Webchat Widget

#### Setup
1. Im Dashboard → Kanäle:
   - Webchat aktivieren (Toggle)
   - Widget-Key erstellen
   - Erlaubte Domains setzen (optional, leer = alle)

#### Test
1. Demo-Seite öffnen: `/demo-chat?widgetKey=<your-widget-key>`
2. Nachricht senden (z.B. "Hallo, ich möchte einen Termin buchen")
3. **Erwartet**: Antwort vom Agent
4. **Verifizieren**:
   - Nachricht erscheint im Chat
   - Antwort ist konsistent mit Voice-Agent (gleiche Wissensbasis)
   - Session-ID wird in localStorage gespeichert (`webchat_session_<widgetKey>`)
   - In Supabase: `conversations` + `conversation_messages` Einträge vorhanden

#### Edge Cases
- **Domain-Allowlist**: Request von nicht-erlaubter Domain → 403
- **Invalid widgetKey**: → 401
- **Webchat deaktiviert**: → 403
- **Lange Nachricht (>2000 Zeichen)**: → 400

### 2. WhatsApp Inbound

#### Setup
1. Im Dashboard → Kanäle:
   - WhatsApp aktivieren (Toggle)
   - `whatsapp_to` setzen (z.B. `whatsapp:+41791234567`)
   - Webhook URL kopieren und in Twilio Console setzen

#### Test
1. WhatsApp-Nachricht an konfigurierte Nummer senden
2. **Erwartet**: Automatische Antwort per WhatsApp
3. **Verifizieren**:
   - Antwort kommt innerhalb von 2-3 Sekunden
   - Antwort ist konsistent mit Voice-Agent
   - In Supabase: `conversations` + `conversation_messages` Einträge vorhanden
   - `external_message_id` = Twilio `MessageSid` (für Idempotency)

#### Idempotency Test
1. Gleiche WhatsApp-Nachricht erneut senden (Twilio retry)
2. **Erwartet**: Keine doppelte Antwort, aber 200 TwiML (leer oder "ok")
3. **Verifizieren**: Nur 1 Message-Eintrag in DB mit diesem `MessageSid`

#### Edge Cases
- **Unbekannte To-Nummer**: → TwiML "Nummer nicht konfiguriert"
- **WhatsApp deaktiviert**: → TwiML "WhatsApp deaktiviert"
- **Fehler im AgentCore**: → TwiML Fallback-Text (kein Crash)
- **Sehr lange Antwort (>4000 Zeichen)**: → Truncated auf 4000 Zeichen

### 3. AgentCore "Same Brain" Verifikation

#### Test
1. **Voice**: Anruf → Frage stellen (z.B. "Was sind Ihre Öffnungszeiten?")
2. **Webchat**: Gleiche Frage stellen
3. **WhatsApp**: Gleiche Frage stellen
4. **Erwartet**: Alle 3 Antworten nutzen dieselbe Wissensbasis (RAG) und Tools

#### Verifizieren
- RAG-Kontext ist identisch (gleiche `locationId`)
- Tool-Registry ist identisch (z.B. Kalender-Buchung funktioniert in allen Kanälen)
- Prompt-Templates sind identisch (gleiche System-Prompts)

### 4. Conversation Persistence

#### Test
1. Webchat: Mehrere Nachrichten in derselben Session
2. **Erwartet**: Agent hat Kontext aus vorherigen Nachrichten
3. **Verifizieren**:
   - `conversations` Tabelle: 1 Eintrag pro `location_id + channel + external_user_id`
   - `conversation_messages`: Alle Messages in chronologischer Reihenfolge
   - `last_message_at` wird aktualisiert

### 5. Voice Flow Unverändert (Regression)

#### Test
1. Bestehender Voice-Flow testen: `POST /api/twilio/voice/inbound`
2. **Erwartet**: 
   - ElevenLabs register-call funktioniert weiterhin
   - TwiML wird korrekt zurückgegeben
   - Keine Breaking Changes

#### Verifizieren
- Voice-Webhook antwortet mit TwiML (application/xml)
- Call-Logs werden weiterhin in `call_logs` gespeichert
- Keine Fehler in Logs

## Datenbank-Checks

### Nach Webchat-Test
```sql
-- Conversations prüfen
SELECT * FROM conversations WHERE channel = 'webchat' ORDER BY created_at DESC LIMIT 5;

-- Messages prüfen
SELECT cm.*, c.external_user_id 
FROM conversation_messages cm
JOIN conversations c ON cm.conversation_id = c.id
WHERE cm.channel = 'webchat'
ORDER BY cm.created_at DESC LIMIT 10;
```

### Nach WhatsApp-Test
```sql
-- Conversations prüfen
SELECT * FROM conversations WHERE channel = 'whatsapp' ORDER BY created_at DESC LIMIT 5;

-- Messages mit MessageSid prüfen
SELECT cm.*, c.external_user_id 
FROM conversation_messages cm
JOIN conversations c ON cm.conversation_id = c.id
WHERE cm.channel = 'whatsapp' AND cm.external_message_id IS NOT NULL
ORDER BY cm.created_at DESC LIMIT 10;
```

## Logs prüfen

### Backend Logs (Structured Logging)
- `webchat.message_handled`: Erfolgreiche Webchat-Nachricht
- `whatsapp.inbound.message_handled`: Erfolgreiche WhatsApp-Nachricht
- `agent_core.handle_message_failed`: Fehler im AgentCore
- `conversations.*`: DB-Operationen

### Fehler-Patterns
- `webchat.resolve_key_failed`: Widget-Key nicht gefunden
- `whatsapp.inbound.location_not_found`: To-Nummer nicht in `channels_config`
- `whatsapp.inbound.duplicate_message`: Idempotency-Check erfolgreich

## Performance

### Erwartete Response Times
- Webchat: < 2 Sekunden (inkl. LLM-Call)
- WhatsApp: < 3 Sekunden (inkl. Twilio Roundtrip)

### Rate Limits
- Webchat: 20 Requests/Minute pro IP (konfigurierbar in `webchatRoutes.ts`)

## Security Checks

1. **Twilio Signature Validation**: 
   - WhatsApp Webhook ohne gültige Signatur → 403
   - Mit gültiger Signatur → 200

2. **Widget Key Security**:
   - Invalid key → 401
   - Domain-Allowlist → Origin-Header wird geprüft

3. **Location Isolation**:
   - Widget-Key kann nur auf eigene `location_id` zugreifen
   - WhatsApp To-Nummer ist eindeutig pro Location

## Bekannte Limitationen

1. **WhatsApp Message Length**: Max 4096 Zeichen (Twilio Limit) → Antworten werden bei 4000 Zeichen getrunkt
2. **Webchat Session**: Persistiert nur im Browser (localStorage) → bei Cookie-Clear verloren
3. **Conversation History**: Aktuell 20 Messages für Kontext (konfigurierbar in `agentCore.ts`)

## Troubleshooting

### Webchat antwortet nicht
1. Widget-Key prüfen (Dashboard → Kanäle)
2. Domain-Allowlist prüfen (Origin-Header)
3. Backend-Logs prüfen (`webchat.*`)

### WhatsApp antwortet nicht
1. Twilio Console: Webhook-URL prüfen
2. `channels_config.whatsapp_to` prüfen (muss exakt mit Twilio To übereinstimmen)
3. Twilio Signature Validation prüfen (Logs)
4. Backend-Logs prüfen (`whatsapp.*`)

### AgentCore Fehler
1. RAG-Kontext prüfen (Knowledge Base vorhanden?)
2. Tool-Registry prüfen (Kalender-Token vorhanden?)
3. LLM-Provider prüfen (API-Key, Quota)

## Cleanup nach Tests

```sql
-- Test-Conversations löschen (optional)
DELETE FROM conversation_messages WHERE channel = 'webchat' AND created_at > NOW() - INTERVAL '1 hour';
DELETE FROM conversations WHERE channel = 'webchat' AND created_at > NOW() - INTERVAL '1 hour';
```
