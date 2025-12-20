# Multichannel Same Brain - Implementierungszusammenfassung

## Übersicht
Implementierung eines zentralen AgentCore für Webchat + WhatsApp, der dieselbe KI, Wissensbasis und Tools wie der bestehende Voice-Agent nutzt.

## Implementierte Komponenten

### 1. Datenbank-Migration
**Datei**: `server/db/migrations/019_create_multichannel_tables.sql`

**Neue Tabellen**:
- `channels_config`: Konfiguration pro Location (WhatsApp To-Nummer, Toggles)
- `webchat_widget_keys`: Public Keys für Widget-Authentifizierung + Domain-Allowlist
- `conversations`: Eine Conversation pro Channel/User/Location
- `conversation_messages`: Alle Messages mit Idempotency-Support (external_message_id)

### 2. AgentCore (Zentraler Agent)
**Dateien**:
- `server/src/core/agent/agentCore.ts`: Hauptlogik
- `server/src/core/conversations/conversationRepository.ts`: DB-Operations

**Funktionen**:
- Lädt Conversation History (letzte 20 Messages)
- Nutzt RAG-Kontext (location-scoped)
- Nutzt ToolRegistry (Kalender, CRM, SMS/Email)
- Ruft LLM über `chatService` mit denselben PromptTemplates
- Persistiert alle Messages in DB
- Channel-aware Antworten (kürzer für Text-Kanäle)

### 3. Webchat API & UI
**Backend**:
- `server/src/routes/webchatRoutes.ts`: Public API Route
- `server/src/controllers/webchatController.ts`: Widget-Key Validation + Domain-Allowlist

**Frontend**:
- `src/components/chat/WebchatWidget.tsx`: Chat-UI Komponente
- `src/pages/DemoChatPage.tsx`: Demo-Seite mit Widget

**Features**:
- Public API: `POST /api/webchat/message` (kein Auth, nutzt widgetKey)
- Domain-Allowlist: Origin-Header wird gegen `allowed_domains` geprüft
- Session-Persistenz: `sessionId` in localStorage
- Rate Limiting: 20 Requests/Minute pro IP

### 4. WhatsApp Twilio Webhook
**Dateien**:
- `server/src/controllers/twilioWhatsAppController.ts`: Webhook Handler
- Route: `POST /api/twilio/whatsapp/inbound` (in `twilioRoutes.ts`)

**Features**:
- Twilio Signature Validation (bestehendes Middleware)
- Tenant-Mapping: `channels_config.whatsapp_to` → `location_id`
- Idempotency: `MessageSid` Check (verhindert doppelte Verarbeitung)
- TwiML Reply: `<Response><Message>...</Message></Response>`
- Robustness: Immer 200 + TwiML (auch bei Fehler → Fallback-Text)

### 5. Dashboard Channels Settings
**Dateien**:
- `src/pages/ChannelsPage.tsx`: Settings-UI
- `server/src/routes/channelRoutes.ts`: Backend API

**Features**:
- Toggle: `webchat_enabled`, `whatsapp_enabled`
- WhatsApp To-Nummer konfigurieren
- Widget-Keys: Create/Delete/Rotate
- Domain-Allowlist pro Widget-Key
- Webhook URL anzeigen (für Twilio Console)

**Navigation**:
- Neue Route: `/dashboard/channels`
- SideNav: "Kanäle" Eintrag hinzugefügt

### 6. Marketing Updates
**Dateien**:
- `src/data/features.ts`: Feature "Multichannel Pack" hinzugefügt
- `src/components/Integrations.tsx`: WhatsApp als Integration
- `src/components/Pricing.tsx`: Multichannel Pack Add-on Sektion

**Updates**:
- Features-Liste: Neues Feature mit MessageSquare Icon
- Integrations: WhatsApp Card hinzugefügt
- Pricing: Vergleichstabelle erweitert + Multichannel Pack Sektion mit CTA

## Architektur-Diagramm

```
Webchat Widget → POST /api/webchat/message → AgentCore.handleMessage()
                                                      ↓
Twilio WhatsApp → POST /api/twilio/whatsapp/inbound → AgentCore.handleMessage()
                                                      ↓
                                    ┌─────────────────┴─────────────────┐
                                    ↓                                   ↓
                            RAG Context Builder              Tool Registry
                            (location-scoped)               (location-scoped)
                                    ↓                                   ↓
                            chatService (LLM)              Calendar/CRM/SMS
                            (PromptTemplates)
                                    ↓
                            Conversation Repository
                            (Persist Messages)
```

## Datenfluss

1. **Inbound Message** (Webchat/WhatsApp)
   - Channel Adapter validiert/parsed Input
   - Resolves `locationId` (via widgetKey oder `channels_config`)
   - Idempotency Check (WhatsApp: `MessageSid`)

2. **AgentCore Processing**
   - Load/Get Conversation
   - Load History (last 20 messages)
   - Build RAG Context (location-scoped)
   - Create Tool Registry (location-scoped)
   - Build Prompt Context (mit History + RAG + Tools)
   - Call LLM (`chatService.chatComplete`)
   - Execute Tool Calls (wenn vorhanden)
   - Save User Message + Assistant Response

3. **Response**
   - Webchat: JSON `{ text, sessionId }`
   - WhatsApp: TwiML `<Response><Message>...</Message></Response>`

## Sicherheit

- **Twilio Signature**: WhatsApp Webhooks werden validiert
- **Widget Keys**: Public Keys mit Domain-Allowlist
- **Rate Limiting**: Webchat API (20 req/min)
- **Location Isolation**: Widget-Key/WhatsApp-Nummer ist eindeutig pro Location

## Idempotency

- **WhatsApp**: `conversation_messages.external_message_id = MessageSid` (Unique Constraint)
- **Webchat**: Session-basiert (keine doppelten Requests erwartet, aber möglich)

## Breaking Changes

**Keine**: Voice-Flow (`POST /api/twilio/voice/inbound`) bleibt unverändert und nutzt weiterhin ElevenLabs register-call.

## Setup-Anleitung

### 1. Datenbank-Migration
```sql
-- In Supabase SQL Editor ausführen:
-- server/db/migrations/019_create_multichannel_tables.sql
```

### 2. Twilio WhatsApp Setup
1. Twilio Console → WhatsApp → Inbound Webhook
2. URL setzen: `https://your-domain.com/api/twilio/whatsapp/inbound`
3. WhatsApp To-Nummer notieren (z.B. `whatsapp:+41791234567`)

### 3. Dashboard Konfiguration
1. Login → Dashboard → Kanäle
2. WhatsApp aktivieren + To-Nummer eintragen
3. Webchat aktivieren + Widget-Key erstellen
4. Domain-Allowlist setzen (optional)

### 4. Testen
- Webchat: `/demo-chat?widgetKey=<your-key>`
- WhatsApp: Nachricht an konfigurierte Nummer senden

## Nächste Schritte (Optional)

1. **Conversation Analytics**: Dashboard für alle Channels
2. **Human Handoff**: Übergabe an Mensch bei High-Intent
3. **Multi-Language**: Channel-spezifische Sprachauswahl
4. **Rich Media**: WhatsApp Bilder/Dokumente unterstützen
5. **Webhook Events**: Tool-Webhooks für externe Systeme

## Dateien-Übersicht

### Backend (Server)
- `server/db/migrations/019_create_multichannel_tables.sql`
- `server/src/core/agent/agentCore.ts`
- `server/src/core/conversations/conversationRepository.ts`
- `server/src/controllers/webchatController.ts`
- `server/src/controllers/twilioWhatsAppController.ts`
- `server/src/routes/webchatRoutes.ts`
- `server/src/routes/channelRoutes.ts`
- `server/src/app.ts` (Routes hinzugefügt)

### Frontend
- `src/components/chat/WebchatWidget.tsx`
- `src/pages/DemoChatPage.tsx`
- `src/pages/ChannelsPage.tsx`
- `src/components/dashboard/SideNav.tsx` (Channels Link)
- `src/config/navigation.ts` (ROUTES.CHANNELS)
- `src/App.tsx` (Routes hinzugefügt)
- `src/data/features.ts` (Multichannel Feature)
- `src/components/Integrations.tsx` (WhatsApp)
- `src/components/Pricing.tsx` (Multichannel Pack Sektion)

### Dokumentation
- `docs/MULTICHANNEL_QA_GUIDE.md`
- `docs/MULTICHANNEL_IMPLEMENTATION_SUMMARY.md` (dieses Dokument)
