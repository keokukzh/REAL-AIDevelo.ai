# ⚠️ Schema Conflict Detected

## Current Database State

### Legacy Tables Found (Old Schema)
- ✅ `agents` - Old agent structure (JSONB columns: business_profile, config, telephony, voice_cloning)
- ✅ `purchases` - Old purchase tracking
- ✅ `call_history` - Old call history (linked to agents)
- ✅ `rag_documents` - Old RAG documents (linked to agents)
- ✅ `phone_numbers` - Old phone numbers (different structure: provider_sid, number, assigned_agent_id)
- ✅ `call_logs` - Old call logs (different structure: agent_id, customer_id)
- ✅ `users` - Old users table (only: id, name, email, created_at - NO org_id, NO supabase_user_id)
- ✅ `audit_logs` - Audit logging
- ✅ `agent_call_metrics` - Metrics table
- ✅ `schema_migrations` - Migration tracking

### Required New Tables (Missing)
- ❌ `organizations` - Multi-tenant root (REQUIRED)
- ❌ `locations` - Business locations per org (REQUIRED)
- ❌ `agent_configs` - New agent config structure (REQUIRED)
- ❌ `google_calendar_integrations` - Calendar integrations (REQUIRED)
- ❌ `porting_requests` - Number porting requests (REQUIRED)

## Code Analysis

### New Code (Expects New Schema)
- `server/src/services/supabaseDb.ts` - Uses: `organizations`, `users` (with org_id), `locations`, `agent_configs`
- `server/src/middleware/supabaseAuth.ts` - Expects new user structure

### Legacy Code (Still Uses Old Schema)
- `server/src/services/postgresDb.ts` - Uses: `agents`, `purchases`
- `server/src/services/db.ts` - Uses: `agents`, `purchases`
- `server/src/repositories/telephonyRepository.ts` - Uses: `agents`
- `server/src/routes/privacyRoutes.ts` - Uses: `agents`, `call_history`, `rag_documents`

## Conflict Impact

1. **User Authentication**: New code expects `users` table with `org_id` and `supabase_user_id`, but current table only has `name` and `email`
2. **Agent Management**: New code expects `agent_configs` linked to `locations`, but legacy code uses `agents` table
3. **Multi-tenancy**: New schema requires `organizations` table, but it doesn't exist

## Options

### Option A: New Supabase Project (RECOMMENDED) ✅

**Pros:**
- Clean slate, no migration complexity
- No risk of data loss
- Faster setup
- Guaranteed schema consistency

**Steps:**
1. Create new Supabase project at https://supabase.com
2. Copy `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from new project
3. Run `server/db/schema.sql` in new project's SQL Editor
4. Update environment variables in `.env` files
5. Update Cloudflare Pages and Render environment variables

**Estimated Time:** 10-15 minutes

### Option B: Migration (Rename/Drop Legacy Tables) ⚠️

**WARNING:** This will delete all existing data in legacy tables!

**Steps (Manual - NOT automated):**
1. Backup existing data (if needed)
2. Drop foreign key constraints:
   ```sql
   ALTER TABLE call_history DROP CONSTRAINT IF EXISTS call_history_agent_id_fkey;
   ALTER TABLE rag_documents DROP CONSTRAINT IF EXISTS rag_documents_agent_id_fkey;
   ALTER TABLE call_logs DROP CONSTRAINT IF EXISTS call_logs_agent_id_fkey;
   ALTER TABLE phone_numbers DROP CONSTRAINT IF EXISTS phone_numbers_assigned_agent_id_fkey;
   ALTER TABLE purchases DROP CONSTRAINT IF EXISTS purchases_agent_id_fkey;
   ```
3. Rename legacy tables:
   ```sql
   ALTER TABLE agents RENAME TO agents_legacy;
   ALTER TABLE purchases RENAME TO purchases_legacy;
   ALTER TABLE call_history RENAME TO call_history_legacy;
   ALTER TABLE rag_documents RENAME TO rag_documents_legacy;
   ALTER TABLE call_logs RENAME TO call_logs_legacy;
   ALTER TABLE phone_numbers RENAME TO phone_numbers_legacy;
   ALTER TABLE users RENAME TO users_legacy;
   ```
4. Run `server/db/schema.sql` to create new tables
5. Update all code references from old tables to new tables
6. Migrate data (if needed) - manual process

**Estimated Time:** 2-4 hours (with testing)

**Risks:**
- Data loss if not backed up
- Code changes required in multiple files
- Testing needed to ensure nothing breaks

## Recommendation

**Choose Option A (New Supabase Project)** unless you have critical production data in the legacy tables that must be preserved.
