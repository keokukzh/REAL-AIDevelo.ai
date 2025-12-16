# ElevenLabs Webhook Secret Setup

## Übersicht

Die ElevenLabs Webhook-Verifizierung wurde implementiert, um sicherzustellen, dass Webhook-Requests wirklich von ElevenLabs kommen und nicht manipuliert wurden.

## Environment Variable

**In Render Environment Variables hinzufügen:**

| Variable Name | Wert | Beispiel |
|---------------|------|----------|
| `ELEVENLABS_WEBHOOK_SECRET` | Dein ElevenLabs Webhook Secret | `wsec_f33540691158e6988cf0b0ab0a6f35a18cd9b3e6aa2975c29972fd4f92611c08` |

**Fallback:** Falls `ELEVENLABS_WEBHOOK_SECRET` nicht gesetzt ist, wird `TOOL_SHARED_SECRET` verwendet.

## Setup in Render

### Schritt 1: Render Dashboard öffnen
1. Gehe zu: https://dashboard.render.com/
2. Wähle deinen Service: "REAL-AIDevelo.ai"

### Schritt 2: Environment Variable hinzufügen
1. Klicke auf "Environment" Tab
2. Klicke auf "+ Add Environment Variable"
3. **KEY:** `ELEVENLABS_WEBHOOK_SECRET`
4. **VALUE:** `wsec_f33540691158e6988cf0b0ab0a6f35a18cd9b3e6aa2975c29972fd4f92611c08`
5. Klicke auf "Save Changes"
6. Service startet automatisch neu

## Webhook Endpoint

**URL:** `https://real-aidevelo-ai.onrender.com/api/sync/webhook`

**Method:** `POST`

**Content-Type:** `application/json`

## Signature Format

ElevenLabs sendet Webhooks mit einem `ElevenLabs-Signature` Header im Format:

```
t=timestamp,v0=hash
```

**Beispiel:**
```
ElevenLabs-Signature: t=1702742400,v0=abc123def456...
```

## Verifizierung

Die Middleware verifiziert:

1. **Signature Header vorhanden:** `ElevenLabs-Signature` Header muss vorhanden sein
2. **Timestamp Validierung:** Timestamp darf nicht älter als 30 Minuten sein (Replay-Attack-Schutz)
3. **HMAC-SHA256 Verifizierung:** 
   - Message: `${timestamp}.${request_body}`
   - Hash: `HMAC-SHA256(secret, message).hex()`
   - Vergleich mit `timingSafeEqual` (Timing-Attack-Schutz)

## Security Features

✅ **HMAC-SHA256 Signatur-Verifizierung**  
✅ **Timestamp-Validierung** (30 Minuten Toleranz)  
✅ **Timing-Safe Comparison** (verhindert Timing-Attacks)  
✅ **Replay-Attack-Schutz** (alte Timestamps werden abgelehnt)

## Test

Nach dem Deployment kannst du testen:

```bash
# Test Webhook (mit gültiger Signatur von ElevenLabs)
curl -X POST https://real-aidevelo-ai.onrender.com/api/sync/webhook \
  -H "Content-Type: application/json" \
  -H "ElevenLabs-Signature: t=1702742400,v0=abc123..." \
  -d '{"event":"agent.status_changed","timestamp":"2025-12-16T18:00:00Z"}'
```

**Erwartete Antwort:**
- ✅ **200 OK** wenn Signatur gültig
- ❌ **403 Forbidden** wenn Signatur ungültig oder fehlt
- ❌ **403 Forbidden** wenn Timestamp zu alt (>30 min)

## Logs

Die Middleware loggt:

- ✅ Erfolgreiche Verifizierung: `[ElevenLabs] Webhook signature verified successfully`
- ⚠️ Fehlende Signatur: `[ElevenLabs] Missing signature header in webhook request`
- ⚠️ Ungültige Signatur: `[ElevenLabs] Signature verification failed`
- ⚠️ Timestamp zu alt: `[ElevenLabs] Webhook timestamp too old or too far in future`

## Troubleshooting

### Problem: "Missing ElevenLabs signature header"
**Lösung:** Stelle sicher, dass ElevenLabs den `ElevenLabs-Signature` Header sendet. Prüfe die ElevenLabs Webhook-Konfiguration.

### Problem: "Invalid webhook signature"
**Lösung:** 
1. Prüfe, ob `ELEVENLABS_WEBHOOK_SECRET` in Render korrekt gesetzt ist
2. Stelle sicher, dass das Secret in ElevenLabs Dashboard mit dem in Render übereinstimmt
3. Prüfe, ob der Request Body exakt so ist, wie ElevenLabs ihn sendet

### Problem: "Webhook timestamp outside acceptable range"
**Lösung:** Der Webhook ist zu alt (>30 Minuten). Normalerweise sollte das nicht passieren, außer bei Test-Requests.

## Development Mode

In Development (wenn `NODE_ENV !== 'production'`):
- Wenn `ELEVENLABS_WEBHOOK_SECRET` nicht gesetzt ist, wird die Verifizierung übersprungen
- Warnung wird geloggt: `[ElevenLabs] ELEVENLABS_WEBHOOK_SECRET not set; skipping signature validation (development only)`

**⚠️ WICHTIG:** In Production wird die Verifizierung **immer** durchgeführt!

## Code Location

- **Middleware:** `server/src/middleware/verifyElevenLabsWebhook.ts`
- **Route:** `server/src/routes/syncRoutes.ts` (Zeile 99)
- **Service:** `server/src/services/syncService.ts` (Zeile 125)
