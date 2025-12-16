# Integration Environment Variables

Diese Dokumentation listet alle benötigten Environment Variables für die vollständige Integration von Knowledge Base, Agent, ElevenLabs und Twilio.

## Required Variables (Production)

### Supabase
- `SUPABASE_URL` - Supabase Projekt URL (z.B. `https://xxxxx.supabase.co`)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase Service Role Key (Server-only, niemals im Frontend!)

### ElevenLabs
- `ELEVENLABS_API_KEY` - ElevenLabs API Key für Voice Agent
- `ELEVENLABS_AGENT_ID_DEFAULT` - Default ElevenLabs Agent ID (optional, kann auch in DB gesetzt werden)
- `ELEVENLABS_WEBHOOK_SECRET` - Secret für ElevenLabs Webhook Validierung

### Twilio
- `TWILIO_ACCOUNT_SID` - Twilio Account SID
- `TWILIO_AUTH_TOKEN` - Twilio Auth Token
- `TWILIO_STREAM_TOKEN` - Token für Twilio Media Streams (für Voice Calls)

### Server Configuration
- `PUBLIC_BASE_URL` - Öffentliche HTTPS URL des Backends (für Webhooks/OAuth)
  - Beispiel: `https://real-aidevelo-ai.onrender.com`
  - Wird für Twilio Webhooks und OAuth Redirects verwendet
- `NODE_ENV` - Environment Mode (`production` oder `development`)

## Optional Variables

### Vector Store (RAG)
- `QDRANT_URL` - Qdrant Vector Database URL
  - Local: `http://localhost:6333`
  - Production: Qdrant Cloud URL
- `QDRANT_API_KEY` - Qdrant API Key (optional für local, required für Qdrant Cloud)

### Embeddings (RAG)
- `OPENAI_API_KEY` - OpenAI API Key für Embeddings
  - Wird für `text-embedding-3-small` Model verwendet
  - Alternative: Kann durch andere Embedding-Services ersetzt werden

### Media Streams
- `ENABLE_MEDIA_STREAMS` - Enable Twilio Media Streams (`true` oder `false`)
  - Default: `false`
  - Muss `true` sein für Voice Calls mit ElevenLabs

### Token Encryption
- `TOKEN_ENCRYPTION_KEY` - 32-byte Base64 Key für Token-Verschlüsselung
  - Generate: `openssl rand -base64 32`
  - Wird für verschlüsselte Calendar Refresh Tokens verwendet

### Google Calendar
- `GOOGLE_OAUTH_CLIENT_ID` - Google OAuth Client ID
- `GOOGLE_OAUTH_CLIENT_SECRET` - Google OAuth Client Secret
- `GOOGLE_OAUTH_REDIRECT_URL` - OAuth Redirect URL (wird normalerweise aus PUBLIC_BASE_URL generiert)

### Frontend
- `FRONTEND_URL` - Frontend URL für OAuth postMessage Security
  - Beispiel: `https://aidevelo.ai`

## Environment Variables Check

Das Integration Test Script (`server/src/scripts/test-integration.ts`) prüft automatisch alle Environment Variables.

### Quick Check

```bash
# Prüfe Required Variables
echo "SUPABASE_URL: ${SUPABASE_URL:+✅ Set}"
echo "ELEVENLABS_API_KEY: ${ELEVENLABS_API_KEY:+✅ Set}"
echo "TWILIO_ACCOUNT_SID: ${TWILIO_ACCOUNT_SID:+✅ Set}"
echo "PUBLIC_BASE_URL: ${PUBLIC_BASE_URL:+✅ Set}"
```

## Setup Checklist

### Knowledge Base (RAG)
- [ ] `SUPABASE_URL` gesetzt
- [ ] `SUPABASE_SERVICE_ROLE_KEY` gesetzt
- [ ] `QDRANT_URL` gesetzt (optional für local)
- [ ] `OPENAI_API_KEY` gesetzt (für Embeddings)
- [ ] `rag_documents` Tabelle existiert in Supabase

### Agent Integration
- [ ] `ELEVENLABS_API_KEY` gesetzt
- [ ] `ELEVENLABS_AGENT_ID_DEFAULT` gesetzt ODER `eleven_agent_id` in `agent_configs` Tabelle
- [ ] RAG enabled in `voiceAgentConfig.rag.enabled`

### ElevenLabs
- [ ] `ELEVENLABS_API_KEY` validiert (Test: `GET /api/elevenlabs/test`)
- [ ] Agent ID existiert in ElevenLabs
- [ ] Webhook Secret gesetzt (falls Webhooks verwendet werden)

### Twilio
- [ ] `TWILIO_ACCOUNT_SID` gesetzt
- [ ] `TWILIO_AUTH_TOKEN` gesetzt
- [ ] `TWILIO_STREAM_TOKEN` gesetzt (für Media Streams)
- [ ] `PUBLIC_BASE_URL` korrekt gesetzt
- [ ] Webhook URL in Twilio konfiguriert: `${PUBLIC_BASE_URL}/api/twilio/voice/inbound`
- [ ] `X-Twilio-Signature` Validierung aktiviert

## Testing

### Test Endpoints (Dev Only)

Alle Test-Endpunkte sind nur verfügbar wenn `NODE_ENV !== 'production'`:

- `POST /api/dev/rag/test-query` - Test RAG Query
- `POST /api/dev/rag/test-agent` - Test Agent mit RAG
- `POST /api/dev/elevenlabs/test-connection` - Test ElevenLabs Verbindung
- `POST /api/dev/elevenlabs/test-rag` - Test ElevenLabs RAG Integration
- `POST /api/dev/twilio/test-webhook` - Test Twilio Webhook
- `GET /api/dev/twilio/test-twiml` - Test TwiML Generation

### Integration Test Script

```bash
# Run integration tests
cd server
tsx src/scripts/test-integration.ts

# With custom location ID
TEST_LOCATION_ID=your-location-id tsx src/scripts/test-integration.ts

# With custom API URL
API_URL=https://your-backend.onrender.com/api tsx src/scripts/test-integration.ts
```

## Troubleshooting

### Knowledge Base 500 Error

**Symptom**: `GET /api/rag/documents` gibt 500 zurück

**Mögliche Ursachen:**
1. `rag_documents` Tabelle existiert nicht → Migration ausführen
2. `locationId` kann nicht aufgelöst werden → Prüfe `users` und `locations` Tabellen
3. Supabase Verbindung fehlgeschlagen → Prüfe `SUPABASE_URL` und `SUPABASE_SERVICE_ROLE_KEY`

**Fix:**
- Prüfe Backend Logs für detaillierte Fehlermeldung
- Führe Migration `009_enhance_rag_documents_for_knowledge.sql` aus
- Prüfe `NOTIFY pgrst, 'reload schema';` in Supabase SQL Editor

### ElevenLabs Connection Failed

**Symptom**: Agent kann nicht mit ElevenLabs verbinden

**Mögliche Ursachen:**
1. `ELEVENLABS_API_KEY` nicht gesetzt oder ungültig
2. Agent ID existiert nicht in ElevenLabs
3. WebSocket Verbindung blockiert

**Fix:**
- Test: `GET /api/elevenlabs/test`
- Prüfe Agent ID in ElevenLabs Dashboard
- Prüfe `agent_configs.eleven_agent_id` in Supabase

### Twilio Webhook Failed

**Symptom**: Twilio Webhook gibt Fehler zurück

**Mögliche Ursachen:**
1. `X-Twilio-Signature` Validierung fehlgeschlagen
2. `PUBLIC_BASE_URL` falsch konfiguriert
3. Webhook URL in Twilio falsch

**Fix:**
- Prüfe `PUBLIC_BASE_URL` entspricht der tatsächlichen Backend-URL
- Prüfe Webhook URL in Twilio Console
- Test: `POST /api/dev/twilio/test-webhook`

## Production Deployment

### Render Environment Variables

Setze alle Required Variables in Render Dashboard:
1. Gehe zu Render Dashboard → Your Service → Environment
2. Füge alle Required Variables hinzu
3. Redeploy Service

### Supabase Migrations

Stelle sicher, dass alle Migrations ausgeführt wurden:
- `004_create_rag_documents_table.sql`
- `009_enhance_rag_documents_for_knowledge.sql`
- `016_migrate_rag_documents_to_location.sql`

Führe nach Migrationen aus:
```sql
NOTIFY pgrst, 'reload schema';
```
