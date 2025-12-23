# Backend deploy to Render (Archive)

This document is kept for historical context. **Do not commit secrets**.

## Render settings (recommended)
- Type: Web Service (Node)
- Root directory: `.` (repo root)
- Build command: `cd server && npm ci && npm run build`
- Start command: `cd server && npm start`

## Environment variables
Set these in Render Dashboard → Environment:

- `NODE_ENV=production`
- `PORT=5000` (Render may override)
- `SUPABASE_URL` (from Supabase project settings)
- `SUPABASE_SERVICE_ROLE_KEY` (server secret)
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_WEBHOOK_SECRET`
- `TWILIO_STREAM_TOKEN`

Optional / legacy:
- `DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres`

## Verify
- `GET /health`
