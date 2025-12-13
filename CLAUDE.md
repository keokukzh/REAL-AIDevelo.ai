# AIDevelo – Build Rules

## Milestones (Stop Conditions)
1) Phase 1 done: dashboard loads, no blank screen, POST /api/agent/default idempotent.
2) Phase 2 done: inbound call answers live via Twilio webhook -> ElevenLabs register-call -> TwiML.
3) Phase 3 done: Google connect works + tools check_availability + create_appointment work.
4) Phase 4 done: monorepo restructure ONLY file moves + scripts, no feature changes.

## Hard constraints
- No Stripe. No Railway. No Twilio Media Streams. No OpenAI Realtime experiments.
- ElevenLabs register-call must return TwiML (application/xml).
- Twilio webhook requests must validate X-Twilio-Signature (watch SSL termination).
- Google OAuth must use access_type=offline (and handle refresh_token returned only on first consent).
