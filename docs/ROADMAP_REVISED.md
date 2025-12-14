# AIDevelo.ai - Überarbeitete Roadmap (Beta → Production)

**Datum:** 2025-01-XX  
**Status:** Aktiv in Entwicklung  
**Fokus:** Kernfunktionen stabil + schnell testbar, Billing später

---

## 🎯 Strategie & Prioritäten

### Hard Constraints
1. **Kein Stripe/Billing in dieser Phase**
   - Alle Stripe/Billing Features → Phase 5 (später)
   - Feature Flag: `ENABLE_BILLING=false` (Standard)
   - UI zeigt "Coming soon" für Billing-Features

2. **Dev/Test: Schnelles Login**
   - Dev-Bypass-Auth: `DEV_BYPASS_AUTH=true` (nur dev/test)
   - Seed-User/Seed-Location automatisch verfügbar
   - Playwright/E2E nutzt denselben Shortcut (kein echtes OAuth)

3. **Fokus: Kernfunktionen stabil**
   - Dashboard Quick Actions vollständig funktionsfähig
   - Google Calendar Tokens robust in DB
   - RAG Knowledge Base pro Location
   - Media Streams Bridge Twilio ↔ ElevenLabs

---

## 📋 Phasen-Übersicht

| Phase | Fokus | Dauer | Status |
|-------|-------|-------|--------|
| **Phase 1** | Dashboard Buttons komplett | 2-3 Wochen | 🔄 In Arbeit |
| **Phase 2** | Google Calendar DB Tokens + Refresh | 1-2 Wochen | ⏳ Geplant |
| **Phase 3** | RAG Knowledge Base pro Location | 2-3 Wochen | ⏳ Geplant |
| **Phase 4** | Media Streams Bridge | 2-3 Wochen | ⏳ Geplant |
| **Phase 5** | Stripe/Billing/Subscriptions | Später | ⏸️ Deferred |

**Gesamt:** ~8-11 Wochen für Phasen 1-4

---

## 📐 Definition of Done (DoD)

Jede Story muss erfüllen:

- ✅ **UI Flow fertig** (Modal/Seite), inkl. Loading/Errors
- ✅ **Backend Endpoint fertig** + validiert (Postman/curl Beispiel)
- ✅ **Status/Cache Refresh** im Dashboard (refetch/invalidations)
- ✅ **Minimal Logging** + klare Fehlermeldungen
- ✅ **Keine Stripe-Abhängigkeiten** in dieser Phase
- ✅ **E2E Test** (wenn möglich) oder manueller Test dokumentiert

---

## Phase 1: Dashboard Buttons komplett funktionsfähig

**Ziel:** Alle Dashboard Quick Actions sind vollständig funktionsfähig und getestet.

### 1.1 Phone Connect Flow

**Tasks:**
- [ ] **phone-connect-modal**: Phone Connect Modal implementieren
  - Datei: `src/components/dashboard/PhoneConnectModal.tsx` (neu)
  - Features:
    - Twilio Numbers API aufrufen (`GET /api/phone/numbers`)
    - Nummer auswählen (Dropdown/Liste)
    - Connect bestätigen (`POST /api/phone/connect`)
    - Loading States, Error Handling
  - Integration: `usePhoneNumbers()` Hook erstellen
- [ ] **phone-connect-endpoint-verify**: Backend Endpoint verifizieren
  - Datei: `server/src/controllers/phoneController.ts` (bereits vorhanden)
  - Test: Webhook-Update nach Connect prüfen
  - Postman/curl Beispiel dokumentieren
- [ ] **phone-status-refresh**: Dashboard Status nach Connect aktualisieren
  - Datei: `src/hooks/useDashboardOverview.ts`
  - Feature: `refetch()` nach erfolgreichem Connect
  - Toast-Notification: "Telefon erfolgreich verbunden"

**DoD:**
- Modal öffnet sich, zeigt verfügbare Nummern
- Connect funktioniert, Dashboard zeigt "Verbunden"
- Webhook URLs werden in Twilio aktualisiert

**Test:**
```bash
# Backend Test
curl -X POST http://localhost:5000/api/phone/connect \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"phoneNumberSid": "PN...", "phoneNumber": "+41..."}'
```

---

### 1.2 Webhook Status Modal

**Tasks:**
- [ ] **webhook-status-modal**: Webhook Status Modal implementieren
  - Datei: `src/components/dashboard/WebhookStatusModal.tsx` (neu)
  - Features:
    - Voice URL anzeigen (aus `GET /api/phone/webhook-status`)
    - Status Callback URL anzeigen
    - Copy-Buttons für beide URLs
    - Test-Webhook Button (optional)
  - Integration: `useWebhookStatus()` Hook
- [ ] **webhook-test-endpoint**: Test-Webhook Endpoint (optional)
  - Datei: `server/src/controllers/phoneController.ts`
  - Endpoint: `POST /api/phone/test-webhook`
  - Feature: Simuliert Twilio Webhook Request

**DoD:**
- Modal zeigt Webhook URLs korrekt an
- Copy-Buttons funktionieren
- URLs sind korrekt formatiert (PUBLIC_BASE_URL)

**Test:**
```bash
curl -X GET http://localhost:5000/api/phone/webhook-status \
  -H "Authorization: Bearer $TOKEN"
```

---

### 1.3 Agent Test Call

**Tasks:**
- [ ] **test-call-endpoint**: Backend Endpoint für Test-Call
  - Datei: `server/src/controllers/dashboardController.ts` (neu oder erweitern)
  - Endpoint: `POST /api/dashboard/test-call`
  - Feature:
    - Twilio Outbound Call zu Admin-Test-Nummer initiieren
    - `twilioService.makeCall()` verwenden
    - Call SID zurückgeben für Tracking
  - Validation: Admin-Test-Nummer aus `agent_configs.admin_test_number`
- [ ] **test-call-ui**: Test Call UI Modal
  - Datei: `src/components/dashboard/TestCallModal.tsx` (neu)
  - Features:
    - Test-Nummer anzeigen (aus Agent Config)
    - "Call starten" Button
    - Call-Status anzeigen (initiated, ringing, answered, completed)
    - Error Handling
  - Integration: `useTestCall()` Hook

**DoD:**
- Test-Call kann gestartet werden
- Call-Status wird angezeigt
- Fehler werden klar kommuniziert

**Test:**
```bash
curl -X POST http://localhost:5000/api/dashboard/test-call \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to": "+41..."}'
```

---

### 1.4 Calls Detail Page + Modal

**Tasks:**
- [ ] **calls-detail-page**: Calls Detail Page implementieren
  - Datei: `src/pages/CallsPage.tsx` (neu)
  - Features:
    - Tabelle mit allen Calls (aus `GET /api/calls`)
    - Filter: Datum, Status, Richtung (inbound/outbound)
    - Pagination (20 pro Seite)
    - Call Details Modal öffnen bei Klick
  - Integration: `useCallLogs()` Hook (bereits vorhanden in `callsController.ts`)
- [ ] **call-details-modal**: Call Details Modal
  - Datei: `src/components/dashboard/CallDetailsModal.tsx` (neu)
  - Features:
    - Vollständige Call-Info (Call SID, Dauer, Status, etc.)
    - Transcript (falls vorhanden in `notes_json`)
    - Notes/Outcome anzeigen
    - Timeline (started_at, ended_at)

**DoD:**
- Calls Page zeigt alle Calls korrekt
- Filter funktionieren
- Call Details Modal zeigt vollständige Info

**Test:**
```bash
curl -X GET "http://localhost:5000/api/calls?limit=20&offset=0" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Phase 2: Google Calendar Tokens robust in DB

**Ziel:** Google Calendar OAuth2 Tokens werden persistent in DB gespeichert, automatisch refresht und im Agent verwendet.

### 2.1 Token Persistierung in DB

**Tasks:**
- [ ] **calendar-token-persistence**: Token-Speicherung in Supabase
  - Datei: `server/src/services/calendarService.ts`
  - Änderung:
    - `storeToken()` speichert in `google_calendar_integrations` Tabelle
    - `refresh_token_encrypted` verschlüsseln (crypto.createCipheriv)
    - `access_token`, `expiry_ts` speichern
    - `location_id` Mapping (nicht `userId`)
  - Encryption Key: `TOKEN_ENCRYPTION_KEY` aus ENV
- [ ] **calendar-token-refresh**: Auto-Refresh implementieren
  - Datei: `server/src/services/calendarService.ts`
  - Funktion: `refreshTokenIfNeeded(locationId: string)`
  - Feature:
    - Prüft `expiry_ts` vor jedem Calendar API Call
    - Refresh wenn < 5 Minuten bis Ablauf
    - Google OAuth2 Token Refresh API verwenden
    - Aktualisiert DB nach Refresh

**DoD:**
- Tokens werden in DB gespeichert (verschlüsselt)
- Auto-Refresh funktioniert vor Ablauf
- Fehler werden geloggt

**Test:**
```bash
# OAuth Callback sollte Token in DB speichern
# Dann: Token Refresh testen
curl -X POST http://localhost:5000/api/calendar/google/refresh \
  -H "Authorization: Bearer $TOKEN"
```

---

### 2.2 Calendar OAuth Callback Update

**Tasks:**
- [ ] **calendar-oauth-callback-update**: OAuth Callback speichert Token in DB
  - Datei: `server/src/routes/calendarRoutes.ts` - `/callback` Endpoint
  - Änderung:
    - Nach `exchangeGoogleCode()` → `storeTokenInDb(locationId, token)`
    - `location_id` aus `req.supabaseUser` → `ensureDefaultLocation()` → Location ID
    - Redirect zu Frontend mit Success-Message
- [ ] **calendar-connect-feedback**: UI-Feedback nach Connect
  - Datei: `src/pages/DashboardPage.tsx` - Calendar Card
  - Feature:
    - Toast-Notification: "Kalender erfolgreich verbunden"
    - Auto-Refresh Dashboard (`refetch()`)
    - Calendar Card zeigt "Verbunden" Status

**DoD:**
- OAuth Flow speichert Token in DB
- UI zeigt Success-Feedback
- Dashboard Status aktualisiert sich automatisch

---

### 2.3 Calendar Tool DB Integration

**Tasks:**
- [ ] **calendar-tool-db-integration**: Calendar Tool verwendet DB-Tokens
  - Datei: `server/src/voice-agent/tools/calendarTool.ts`
  - Änderung:
    - `getCalendarToken(locationId)` lädt Token aus DB
    - `refreshTokenIfNeeded()` vor jedem API-Call
    - Fehler-Handling: "Calendar not connected" wenn kein Token
- [ ] **calendar-availability-check**: `check_availability` Tool funktionsfähig
  - Datei: `server/src/voice-agent/tools/calendarTool.ts`
  - Feature: Google Calendar `freeBusy.query` API verwenden
  - Input: Start/End Time, Calendar ID
  - Output: Verfügbare Slots
- [ ] **calendar-appointment-create**: `create_appointment` Tool funktionsfähig
  - Datei: `server/src/voice-agent/tools/calendarTool.ts`
  - Feature: Google Calendar `events.insert` API verwenden
  - Input: Summary, Start/End Time, Attendees (optional)
  - Output: Event ID

**DoD:**
- Calendar Tools verwenden DB-Tokens
- `check_availability` funktioniert
- `create_appointment` funktioniert
- Fehler werden klar kommuniziert

---

### 2.4 Calendar Disconnect

**Tasks:**
- [ ] **calendar-disconnect-endpoint**: Disconnect Endpoint
  - Datei: `server/src/routes/calendarRoutes.ts`
  - Endpoint: `DELETE /api/calendar/:provider/disconnect`
  - Feature: Löscht Token aus DB (`google_calendar_integrations`)
- [ ] **calendar-disconnect-ui**: Disconnect Button in UI
  - Datei: `src/pages/DashboardPage.tsx` - Calendar Card
  - Feature: "Kalender trennen" Button (nur wenn verbunden)

**DoD:**
- Disconnect funktioniert
- Dashboard Status aktualisiert sich

---

## Phase 3: RAG Knowledge Base pro Location

**Ziel:** Jede Location hat eine eigene Qdrant Collection für Knowledge Base, mit Upload/List/Delete/Embed API und Agent Context Injection.

### 3.1 Qdrant Collection Management

**Tasks:**
- [ ] **qdrant-collection-per-location**: Collection pro Location
  - Datei: `server/src/voice-agent/rag/vectorStore.ts`
  - Änderung:
    - `ensureCollection()` verwendet `location_id` statt `customerId`
    - Collection Name: `location_${location_id}` Format
    - Collection wird beim Location-Setup erstellt
- [ ] **qdrant-collection-init**: Collection-Erstellung beim Setup
  - Datei: `server/src/services/supabaseDb.ts` - `ensureDefaultLocation()`
  - Integration: Nach Location-Erstellung → `vectorStore.ensureCollection(locationId)`

**DoD:**
- Collection wird pro Location erstellt
- Collection Name ist konsistent (`location_${location_id}`)

---

### 3.2 RAG Documents API

**Tasks:**
- [ ] **rag-documents-api**: API Endpoints für Dokumenten-Management
  - Datei: `server/src/routes/ragRoutes.ts` (neu)
  - Endpoints:
    - `POST /api/rag/documents` - Dokument hochladen (Text, PDF, Markdown)
    - `GET /api/rag/documents` - Dokumente auflisten (pro Location)
    - `DELETE /api/rag/documents/:id` - Dokument löschen
    - `POST /api/rag/documents/:id/embed` - Dokument manuell embedden
  - Controller: `server/src/controllers/ragController.ts` (neu)
- [ ] **rag-document-processing**: Dokumenten-Verarbeitung
  - Datei: `server/src/services/documentProcessingService.ts` (neu)
  - Features:
    - PDF Parsing (pdf-parse oder ähnlich)
    - Text Chunking (500-1000 Zeichen pro Chunk)
    - Embedding Generation (OpenAI embeddings API)
    - Vector Store Integration (`vectorStore.addDocument()`)

**DoD:**
- API Endpoints funktionieren
- Dokumente werden korrekt verarbeitet und embedded
- Fehler werden geloggt

**Test:**
```bash
# Upload Document
curl -X POST http://localhost:5000/api/rag/documents \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@document.pdf" \
  -F "title=Test Document"

# List Documents
curl -X GET http://localhost:5000/api/rag/documents \
  -H "Authorization: Bearer $TOKEN"
```

---

### 3.3 RAG Knowledge Base UI

**Tasks:**
- [ ] **rag-documents-page**: Knowledge Base Management Page
  - Datei: `src/pages/RAGDocumentsPage.tsx` (neu)
  - Features:
    - Dokumente auflisten (Tabelle)
    - Upload-Button
    - Delete-Button pro Dokument
    - Preview (optional)
  - Integration: `useRAGDocuments()` Hook
- [ ] **rag-document-upload**: Upload-Komponente
  - Datei: `src/components/rag/DocumentUpload.tsx` (neu)
  - Features:
    - Drag & Drop
    - File-Select
    - Progress Indicator
    - Supported Formats: `.txt`, `.md`, `.pdf`
    - Max File Size: 10MB

**DoD:**
- UI zeigt Dokumente korrekt
- Upload funktioniert
- Delete funktioniert

---

### 3.4 RAG Agent Integration

**Tasks:**
- [ ] **rag-agent-integration**: RAG in Voice Agent Pipeline
  - Datei: `server/src/voice-agent/agent.ts` (oder entsprechende Agent-Datei)
  - Feature:
    - Vor LLM-Call → RAG-Context aus Knowledge Base abrufen
    - `vectorStore.search(query, locationId, limit=5)` für relevante Dokumente
    - Context in System-Prompt injizieren
- [ ] **rag-context-injection**: RAG-Context in LLM-Prompt
  - Datei: `server/src/voice-agent/prompts/` (Agent Prompt Templates)
  - Feature:
    - Relevante Dokumente als Context in System-Prompt einfügen
    - Format: "Based on the following knowledge base: ..."

**DoD:**
- Agent verwendet RAG-Context
- Relevante Dokumente werden abgerufen
- Context wird in Prompt injiziert

---

## Phase 4: Media Streams Bridge Twilio ↔ ElevenLabs

**Ziel:** Twilio Media Streams werden zu ElevenLabs WebSocket gebridged, mit Fallback und Monitoring.

### 4.1 Twilio Media Streams WebSocket Handler

**Tasks:**
- [ ] **twilio-media-stream-endpoint**: Media Streams WebSocket Endpoint
  - Datei: `server/src/routes/twilioRoutes.ts` - `/media-stream` WebSocket Route
  - Feature:
    - Twilio Media Streams WebSocket empfangen
    - Binary Protocol (PCM Audio) parsen
    - Call SID aus Query-Params extrahieren
- [ ] **media-stream-parser**: Media Stream Parser
  - Datei: `server/src/services/twilioMediaStreamService.ts` (neu)
  - Feature:
    - Binary Stream → PCM Audio Chunks parsen
    - Twilio Media Streams Protocol Documentation folgen

**DoD:**
- WebSocket Endpoint empfängt Twilio Streams
- PCM Audio wird korrekt geparst

---

### 4.2 ElevenLabs Bridge Service

**Tasks:**
- [ ] **elevenlabs-bridge-service**: Bridge Service
  - Datei: `server/src/services/elevenLabsBridgeService.ts` (neu)
  - Feature:
    - Twilio Media Stream → PCM Audio → ElevenLabs WebSocket
    - ElevenLabs Audio Response → Twilio Media Stream
    - `ElevenLabsStreamingClient` verwenden
- [ ] **audio-format-conversion**: Audio-Format-Konvertierung
  - Datei: `server/src/services/audioConversionService.ts` (neu)
  - Feature:
    - PCM → WAV/MP3 für ElevenLabs
    - WAV/MP3 → PCM für Twilio
    - Library: `ffmpeg` oder Node.js Audio Libraries

**DoD:**
- Bridge funktioniert bidirektional
- Audio-Formate werden korrekt konvertiert

---

### 4.3 Call Flow Integration

**Tasks:**
- [ ] **twilio-voice-twiml-media-streams**: TwiML mit Media Streams
  - Datei: `server/src/controllers/twilioController.ts` - `handleVoiceInbound()`
  - Änderung:
    - TwiML `<Stream>` Element hinzufügen
    - Stream URL: `wss://${PUBLIC_BASE_URL}/api/twilio/media-stream?callSid={CallSid}`
- [ ] **media-stream-call-routing**: Call-Routing zu ElevenLabs Agent
  - Datei: `server/src/services/elevenLabsBridgeService.ts`
  - Feature:
    - Call SID → Location ID (aus `phone_numbers`)
    - Location ID → Agent Config → ElevenLabs Agent ID
    - `supabaseDb.getAgentConfig()` für Agent-Config

**DoD:**
- TwiML enthält `<Stream>` Element
- Call wird korrekt zu ElevenLabs Agent geroutet

---

### 4.4 Error Handling & Fallback

**Tasks:**
- [ ] **media-stream-error-handling**: Robustes Error Handling
  - Datei: `server/src/services/elevenLabsBridgeService.ts`
  - Features:
    - Reconnection Logic (max 3 Versuche)
    - Fallback zu Standard TwiML (ohne Media Streams)
    - Error Logging
- [ ] **media-stream-monitoring**: Monitoring & Logging
  - Datei: `server/src/services/elevenLabsBridgeService.ts`
  - Feature:
    - Stream-Status (connected, disconnected, error)
    - Latency-Metriken (optional)
    - Error-Rate (optional)

**DoD:**
- Error Handling ist robust
- Fallback funktioniert
- Monitoring ist implementiert

---

## Phase 5: Stripe/Billing/Subscriptions (DEFERRED)

**Status:** ⏸️ Deferred - Wird später implementiert, wenn Phasen 1-4 stabil sind.

**Feature Flag:** `ENABLE_BILLING=false` (Standard)

**Tasks (später):**
- Stripe Integration Setup
- Subscription Management
- Pricing Plans & UI
- Usage Tracking & Billing
- Payment Webhooks

**Hinweis:** Alle Stripe/Billing Code wird hinter Feature Flag gelegt und ist in dieser Phase nicht aktiv.

---

## 🧪 Testing Strategy

### E2E Tests (Playwright)
- Dev-Bypass-Auth verwenden (kein echtes OAuth)
- Seed-User/Seed-Location für Tests
- Mock Calendar Tokens in DB injizieren

### API Tests (Supertest)
- Integration Tests für alle Endpoints
- Mock External Services (Twilio, ElevenLabs, Google)

### Manual Testing
- Jede Story muss manuell getestet werden
- Postman/curl Beispiele dokumentieren

---

## 📝 Next Steps

**Sofort starten:**
1. Dev-Bypass-Auth implementieren (siehe `docs/DEV_FAST_LOGIN.md`)
2. Phase 1.1: Phone Connect Modal
3. Phase 1.2: Webhook Status Modal

**Nach Phase 1:**
- Phase 2: Google Calendar Tokens
- Phase 3: RAG Knowledge Base
- Phase 4: Media Streams Bridge

---

## 🔗 Referenzen

- [DEV_FAST_LOGIN.md](DEV_FAST_LOGIN.md) - Dev-Bypass-Auth Setup
- [API_DOCUMENTATION.md](../server/API_DOCUMENTATION.md) - API Docs
- [SMOKE_TEST.md](SMOKE_TEST.md) - Smoke Test Guide
