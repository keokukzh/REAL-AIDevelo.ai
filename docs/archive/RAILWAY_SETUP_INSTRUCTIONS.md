# Railway Setup (Archive)

This document is kept for historical context. **Do not commit secrets**.

## Variables
Set (or update) these in Railway → Service → Variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_WEBHOOK_SECRET`
- `TWILIO_STREAM_TOKEN`

Optional / legacy:
- `DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres`

## Verify
Run the health check:
- `GET /health`
