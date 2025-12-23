# Supabase Setup Complete (Archive)

This document is kept for historical context.

## Important security note
- Never commit database passwords or service role keys.
- Use placeholders in docs and store real values only in your hosting provider secrets.

## Values you typically need
Frontend (safe for browser):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Backend (server-only secrets):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional / legacy:
- `DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres`
