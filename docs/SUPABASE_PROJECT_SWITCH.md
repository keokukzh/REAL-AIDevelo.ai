# Supabase Project Switch: aidevelo.prod

## Task 1: Configuration Check ✅

### Frontend Environment Variables (`.env.local`)
- ✅ `VITE_API_URL`: SET
- ✅ `VITE_SUPABASE_URL`: SET
- ✅ `VITE_SUPABASE_ANON_KEY`: SET

### Backend Environment Variables (`server/.env`)
- ✅ `SUPABASE_URL`: SET (points to `.supabase.co` - CORRECT)
- ⚠️ `SUPABASE_SERVICE_ROLE_KEY`: Check needed
- ⚠️ `ELEVENLABS_API_KEY`: Check needed
- ⚠️ `PUBLIC_BASE_URL`: Check needed
- ⚠️ `WEB_ORIGIN`: Check needed

### Code Configuration
- ✅ Frontend: `src/lib/supabase.ts` uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- ✅ Backend: `server/src/config/env.ts` uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- ✅ Backend: `server/src/services/supabaseDb.ts` uses config values correctly
- ✅ Backend: `server/src/middleware/supabaseAuth.ts` uses config values correctly

### URL Format Validation
- ✅ `SUPABASE_URL` MUST be `https://<project-ref>.supabase.co` (NOT Render API URL)
- ✅ Current configuration points to `.supabase.co` domain (CORRECT)

## Required Actions

### For New Project "aidevelo.prod"
1. Update `.env.local`:
   - `VITE_SUPABASE_URL=https://aidevelo-prod.supabase.co` (or actual project-ref)
   - `VITE_SUPABASE_ANON_KEY=<new-anon-key-from-aidevelo.prod>`

2. Update `server/.env`:
   - `SUPABASE_URL=https://aidevelo-prod.supabase.co` (or actual project-ref)
   - `SUPABASE_SERVICE_ROLE_KEY=<new-service-role-key-from-aidevelo.prod>`

3. Get keys from Supabase Dashboard:
   - Go to: Supabase Dashboard → aidevelo.prod → Settings → API
   - Copy: Project URL (for SUPABASE_URL / VITE_SUPABASE_URL)
   - Copy: `anon` key (for VITE_SUPABASE_ANON_KEY)
   - Copy: `service_role` key (for SUPABASE_SERVICE_ROLE_KEY)

## Documentation Updates
- ✅ Updated `docs/DEPLOY_ENV_MAP.md` to clarify SUPABASE_URL format
- ✅ Added warning: MUST be `.supabase.co`, NOT Render API URL
