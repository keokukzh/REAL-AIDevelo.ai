# Render Environment Variables (Production Setup)

This repo is designed so **secrets never live in git**.

## Required in Render → Environment

### `DATABASE_URL` (optional / legacy)
- Only needed if you still run legacy Postgres code paths or certain scripts.
- Format (example):
  - `postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres`

### Supabase (required)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Voice providers / webhooks (required for production voice)
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_WEBHOOK_SECRET`
- `TWILIO_STREAM_TOKEN`

## Recommended
- `PUBLIC_BASE_URL` (needed for correct webhook signature validation behind proxies)
- `WEB_ORIGIN` (CORS)

## Quick validation
- API health: `GET /health`
- If auth routes fail with “Supabase not configured”, verify `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.
