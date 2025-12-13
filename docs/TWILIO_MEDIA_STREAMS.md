# Twilio Media Streams (Inbound)

## Goal
When a call hits our Twilio number, Twilio requests:
- `POST https://real-aidevelo-ai.onrender.com/api/twilio/voice/inbound`

We respond with TwiML that opens a Media Stream WebSocket to:
- `wss://real-aidevelo-ai.onrender.com/ws/twilio/stream?token=...`

The WebSocket handler processes Twilio events `start`, `media`, `stop`.

## Endpoints
- **TwiML webhook (HTTP)**: `POST /api/twilio/voice/inbound`
- **Status callback (HTTP)**: `POST /api/twilio/voice/status`
- **Media Stream (WebSocket)**: `GET /ws/twilio/stream?token=...`

## Environment Variables
Required in **production**:
- `TWILIO_AUTH_TOKEN` (validates `X-Twilio-Signature` on webhooks)
- `PUBLIC_BASE_URL=https://real-aidevelo-ai.onrender.com` (signature URL stability behind proxies)
- `TWILIO_STREAM_TOKEN` (authorizes WebSocket stream connections)

Optional (Twilio API / provisioning):
- `TWILIO_ACCOUNT_SID`

## Security
The Media Stream WebSocket only accepts connections when:
- `token` query param equals `TWILIO_STREAM_TOKEN`

If the token is missing or wrong:
- WebSocket upgrade is rejected with `401 Unauthorized`.

## Expected Logs (Render)
On a real inbound call, expected log sequence:
- `[AIDevelo Server] POST /api/twilio/voice/inbound`
- `[TwilioStream] connected`
- `[TwilioStream] start streamSid=... callSid=...`
- `[TwilioStream] media frames=... bytes=...` (periodically)
- `[TwilioStream] stop streamSid=... frames=... bytes=...`
- `[TwilioStream] closed frames=... bytes=...`

## Local WS Simulation
You can simulate Twilio events locally (for development only):

1) Start backend with a token:
```bash
cd server
# set TWILIO_STREAM_TOKEN in your environment before starting
npm run build
npm start
```

2) Run the simulator:
```bash
node server/scripts/simulateTwilioMediaStream.js
```
