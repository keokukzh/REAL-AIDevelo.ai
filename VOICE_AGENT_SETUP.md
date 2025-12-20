# Self-Hosted Voice Agent Setup Guide

## ✅ Implementierung abgeschlossen

Alle Komponenten für den self-hosted Voice Agent wurden implementiert:

### Implementierte Komponenten

1. **Provider Interfaces** ✅
   - ASR Provider (FasterWhisper, OpenAI Whisper Fallback)
   - TTS Provider (Parler-TTS, Piper Fallback)
   - Telephony Adapter (FreeSWITCH, Twilio Fallback)
   - LLM Provider erweitert (vLLM hinzugefügt)

2. **Datenbank-Migrationen** ✅
   - `021_add_voice_agent_tables.sql` erstellt
   - Tabellen: `agent_templates`, `voice_profiles`, `call_sessions`

3. **Python Services** ✅
   - ASR Service (`services/asr-service/`)
   - TTS Service (`services/tts-service/`)

4. **FreeSWITCH Integration** ✅
   - Dialplan, Lua Scripts, Backend Routes

5. **Call Session Manager** ✅
   - Turn-basierte Conversation Loop

6. **AgentCore Voice Extension** ✅
   - Voice Channel Support

7. **Browser Test Call** ✅
   - WebRTC Hook, Test Call Page

8. **Multi-Tenant Provisioning** ✅
   - Automatische Agent-Provisionierung

9. **Docker Compose** ✅
   - Alle Services konfiguriert

10. **Cleanup** ✅
    - ElevenLabs Code-Pfade als deprecated markiert

---

## 🚀 Nächste Schritte

### 1. SIP.js Dependency installieren

```bash
npm install sip.js
```

**Status:** ✅ `package.json` wurde aktualisiert. Führe `npm install` aus.

### 2. Datenbank-Migrationen ausführen

```bash
cd server
npm run migrate
```

**Hinweis:** Die Migration `021_add_voice_agent_tables.sql` wird automatisch ausgeführt.

**Prüfen:** Nach der Migration sollten folgende Tabellen existieren:
- `agent_templates`
- `voice_profiles`
- `call_sessions`

### 3. Services starten

```bash
docker-compose up -d
```

**Services die gestartet werden:**
- `aidevelo` - Hauptanwendung
- `postgres` - Datenbank
- `redis` - Cache/Queue
- `minio` - Object Storage
- `qdrant` - Vector DB
- `freeswitch` - Telephony
- `asr-service` - Speech-to-Text
- `tts-service` - Text-to-Speech
- `vllm` - LLM Service (benötigt GPU)

**Wichtig:** 
- vLLM benötigt eine GPU. Falls keine GPU verfügbar ist, setze `LLM_PROVIDER=openai` in `.env`
- ASR/TTS können CPU-only laufen, aber GPU wird empfohlen

### 4. Environment Variables konfigurieren

Erstelle/aktualisiere `.env` Datei:

```env
# Self-hosted Services
ASR_SERVICE_URL=http://asr-service:8000
TTS_SERVICE_URL=http://tts-service:8000
VLLM_BASE_URL=http://vllm:8000/v1
VLLM_API_KEY=dummy
ASR_PROVIDER=faster_whisper
TTS_PROVIDER=parler
LLM_PROVIDER=vllm  # oder 'openai' wenn keine GPU
TELEPHONY_ADAPTER=freeswitch

# FreeSWITCH
FREESWITCH_ESL_HOST=freeswitch
FREESWITCH_ESL_PORT=8021
FREESWITCH_ESL_PASSWORD=ClueCon

# MinIO
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=recordings

# Redis
REDIS_URL=redis://redis:6379

# Qdrant
QDRANT_URL=http://qdrant:6333
```

### 5. Test Call testen

1. **Frontend starten:**
   ```bash
   npm run dev
   ```

2. **Navigiere zu:** `http://localhost:5000/dashboard/test-call`

3. **Test Call durchführen:**
   - Klicke auf "Mit FreeSWITCH verbinden"
   - Warte auf "Verbunden" Status
   - Klicke auf "Test Call starten"
   - Sprich in das Mikrofon
   - Sieh dir das Live-Transkript an

### 6. Provisioning testen

**Manuell einen Agent provisionieren:**

```bash
curl -X POST http://localhost:5000/api/v1/provision/activate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "location_id": "YOUR_LOCATION_ID",
    "template_slug": "default-de-ch"
  }'
```

**Status prüfen:**

```bash
curl http://localhost:5000/api/v1/provision/status/YOUR_LOCATION_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔧 Troubleshooting

### FreeSWITCH verbindet nicht

1. Prüfe FreeSWITCH Logs:
   ```bash
   docker logs aidevelo-freeswitch
   ```

2. Prüfe ob Ports offen sind:
   ```bash
   netstat -an | grep 5060
   netstat -an | grep 7443
   ```

3. Prüfe FreeSWITCH Status:
   ```bash
   docker exec aidevelo-freeswitch fs_cli -x "status"
   ```

### ASR/TTS Service startet nicht

1. Prüfe Logs:
   ```bash
   docker logs aidevelo-asr
   docker logs aidevelo-tts
   ```

2. Prüfe ob Models geladen werden (kann 1-2 Minuten dauern)

3. CPU-only Mode: Setze `ASR_DEVICE=cpu` und `TTS_DEVICE=cpu` in `.env`

### vLLM startet nicht (keine GPU)

**Lösung:** Setze `LLM_PROVIDER=openai` in `.env` und verwende OpenAI statt vLLM.

Oder entferne vLLM aus `docker-compose.yml` und verwende externe LLM APIs.

### Migration schlägt fehl

1. Prüfe Datenbank-Verbindung:
   ```bash
   docker exec aidevelo-postgres psql -U postgres -d aidevelo -c "SELECT version();"
   ```

2. Prüfe ob `set_updated_at()` Funktion existiert:
   ```bash
   docker exec aidevelo-postgres psql -U postgres -d aidevelo -c "\df set_updated_at"
   ```

3. Falls fehlend, führe `server/db/schema.sql` aus

---

## 📝 Wichtige Dateien

- **Migration:** `server/db/migrations/021_add_voice_agent_tables.sql`
- **Docker Compose:** `docker-compose.yml`
- **FreeSWITCH Config:** `infra/freeswitch/`
- **ASR Service:** `services/asr-service/`
- **TTS Service:** `services/tts-service/`
- **Test Call Page:** `src/pages/TestCallPage.tsx`
- **WebRTC Hook:** `src/hooks/useWebRTC.ts`

---

## 🎯 Nächste Entwicklungsschritte

1. **SIP.js Integration testen** - WebRTC Verbindung zu FreeSWITCH
2. **Voice Profile Customization** - UI für Voice Preset Auswahl
3. **Call Recording** - MinIO Integration für Recordings
4. **Analytics** - Call Metrics Dashboard
5. **Streaming Support** - Real-time Audio Streaming (Phase 2)

---

## 📚 Dokumentation

- [FreeSWITCH Setup](infra/freeswitch/README.md) - (zu erstellen)
- [ASR Service Docs](services/asr-service/README.md) - (zu erstellen)
- [TTS Service Docs](services/tts-service/README.md) - (zu erstellen)

