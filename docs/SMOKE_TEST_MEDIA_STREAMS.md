# Twilio Media Streams - Smoke Test Guide

## Overview
This guide helps you test the Twilio Media Streams Bridge to ElevenLabs integration.

## Prerequisites

### Environment Variables
Required in production:
- `ENABLE_MEDIA_STREAMS=true` (must be explicitly set to enable Media Streams)
- `TWILIO_STREAM_TOKEN` (authorizes WebSocket stream connections)
- `TWILIO_AUTH_TOKEN` (validates `X-Twilio-Signature` on webhooks)
- `PUBLIC_BASE_URL` (e.g., `https://real-aidevelo-ai.onrender.com`)
- `ELEVENLABS_API_KEY` (for ElevenLabs Conversational API)
- `ELEVENLABS_AGENT_ID_DEFAULT` (optional, default ElevenLabs agent ID)

Optional:
- `RAG_MAX_CHUNKS` (default: 5)
- `RAG_MAX_CHARS` (default: 2500)
- `ENABLE_RAG` (default: true)

### Twilio Configuration
1. **Phone Number Webhook URL:**
   - Voice URL: `https://{PUBLIC_BASE_URL}/api/twilio/voice/inbound`
   - Status Callback URL: `https://{PUBLIC_BASE_URL}/api/twilio/voice/status`
   - HTTP Method: POST

2. **Verify Webhook Signature:**
   - Twilio will send `X-Twilio-Signature` header
   - Backend validates using `TWILIO_AUTH_TOKEN`

### Database Setup
1. **Phone Number Record:**
   - Table: `phone_numbers`
   - Required: `e164` or `customer_public_number` matching Twilio number
   - Required: `location_id` pointing to valid location

2. **Agent Config:**
   - Table: `agent_configs`
   - Required: `location_id` matching phone number
   - Required: `eleven_agent_id` (ElevenLabs Conversational Agent ID)

3. **Call Logs:**
   - Table: `call_logs`
   - Will be created automatically on call start

## Test Steps

### 1. Pre-Flight Check
```bash
# Check environment variables
echo $ENABLE_MEDIA_STREAMS
echo $TWILIO_STREAM_TOKEN
echo $PUBLIC_BASE_URL

# Verify TwiML endpoint (should return TwiML with <Stream> if ENABLE_MEDIA_STREAMS=true)
curl -X POST "https://{PUBLIC_BASE_URL}/api/twilio/voice/inbound" \
  -H "X-Twilio-Signature: {signature}" \
  -d "CallSid=CA_TEST&From=%2B1234567890&To=%2B0987654321"
```

Expected Response (if `ENABLE_MEDIA_STREAMS=true`):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="wss://{PUBLIC_BASE_URL}/api/twilio/media-stream?callSid=CA_TEST&token=..." track="both_tracks" />
  </Connect>
</Response>
```

Expected Response (if `ENABLE_MEDIA_STREAMS=false`):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hello, please leave a message after the beep.</Say>
  <Hangup />
</Response>
```

### 2. Make Test Call
1. Call your Twilio phone number
2. Wait for call to connect
3. Speak into phone (e.g., "Hallo, wann habt ihr offen?")
4. Listen for ElevenLabs agent response

### 3. Expected Logs

#### On Call Start:
```
[TwilioController] callSid=CA_xxx ENABLE_MEDIA_STREAMS=true streamUrl=wss://...
[TwilioMediaStream] Session created callSid=CA_xxx
[TwilioMediaStream] start streamSid=MZ_xxx callSid=CA_xxx tracks={"inbound":{"codec":"PCMU","sampleRate":8000},"outbound":{"codec":"PCMU","sampleRate":8000}}
[ElevenLabsBridge] Creating bridge callSid=CA_xxx locationId=xxx agentId=xxx
[ElevenLabsBridge] Connected callSid=CA_xxx agentId=xxx
[ElevenLabs] WebSocket connected
[ElevenLabs] Conversation initiated: conv_xxx
```

#### During Call:
```
[TwilioMediaStream] media callSid=CA_xxx frames=1 bytes=160 queueSize=1 track=inbound
[ElevenLabsBridge] Audio sent callSid=CA_xxx bytesIn=3200 bytesOut=6400
[ElevenLabsBridge] Transcription callSid=CA_xxx text="Hallo, wann habt ihr offen?" isFinal=true
[RAG] query="Hallo, wann habt ihr offen?" results=2 injectedChars=245 locationId=xxx
```

#### On Call End:
```
[TwilioMediaStream] stop streamSid=MZ_xxx callSid=CA_xxx frames=150 bytes=24000
[ElevenLabsBridge] Closing bridge callSid=CA_xxx reason=Twilio stream stopped duration=45s bytesIn=24000 bytesOut=48000
[TwilioMediaStream] Session cleaned up callSid=CA_xxx reason=Twilio stop event
[ElevenLabs] WebSocket closed
```

### 4. Fallback Test (ENABLE_MEDIA_STREAMS=false)
1. Set `ENABLE_MEDIA_STREAMS=false`
2. Make call
3. Expected: Simple TwiML response, no WebSocket connection
4. Logs should show: `[TwilioController] callSid=xxx ENABLE_MEDIA_STREAMS=false, using fallback TwiML`

### 5. Error Scenarios

#### Missing TWILIO_STREAM_TOKEN:
```
[TwilioController] ENABLE_MEDIA_STREAMS=true but TWILIO_STREAM_TOKEN not configured, falling back
```
Expected: Fallback TwiML returned

#### Missing ElevenLabs Agent ID:
```
[ElevenLabsBridge] No ElevenLabs agent ID for locationId=xxx, bridge not created
```
Expected: Bridge not created, but Twilio stream still connected

#### Qdrant/RAG Error:
```
[RAG] failed, continuing without context: Failed to connect to Qdrant
```
Expected: Agent continues without RAG context

#### ElevenLabs Connection Failure:
```
[ElevenLabsBridge] Failed to connect to ElevenLabs callSid=xxx: Connection timeout
[ElevenLabsBridge] Reconnecting attempt=1/3 callSid=xxx
```
Expected: Reconnection attempts (max 3), then bridge closes

## Troubleshooting

### Issue: No WebSocket Connection
- Check `ENABLE_MEDIA_STREAMS=true`
- Check `TWILIO_STREAM_TOKEN` is set
- Check `PUBLIC_BASE_URL` is correct (must be HTTPS/WSS)
- Check Twilio webhook URL configuration

### Issue: Bridge Not Created
- Check `locationId` resolution (phone_number -> location_id)
- Check `agent_configs` table has `eleven_agent_id` for location
- Check logs for: `[ElevenLabsBridge] Could not resolve locationId`

### Issue: No Audio
- Check ElevenLabs agent ID is valid
- Check `ELEVENLABS_API_KEY` is valid
- Check audio conversion logs: `[AudioConversion]`
- Check bridge logs: `[ElevenLabsBridge] Audio sent`

### Issue: High Latency
- Check network connectivity
- Check Qdrant response time (if RAG enabled)
- Check ElevenLabs API latency
- Monitor `bytesIn`/`bytesOut` in logs

## Performance Metrics

Expected values:
- **WebSocket Connection:** < 1s
- **ElevenLabs Connection:** < 2s
- **Audio Latency:** < 500ms (Twilio -> ElevenLabs -> Twilio)
- **RAG Query:** < 300ms (if enabled)
- **Total Response Time:** < 2s (user speaks -> agent responds)

## Next Steps

After successful smoke test:
1. Monitor production logs for errors
2. Test with real customer calls
3. Verify transcript storage (if implemented)
4. Monitor call quality metrics
