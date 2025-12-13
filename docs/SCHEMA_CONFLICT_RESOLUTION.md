# Schema Conflict Resolution

## Error Detected
```
ERROR: column "org_id" does not exist
```

## Root Cause
The `users` table exists with OLD schema (legacy):
- Has: `id`, `name`, `email`, `created_at`
- Missing: `org_id`, `supabase_user_id`

## Current Database State
**MCP Project:** `pdxdgfxhpyefqyouotat.supabase.co` (OLD project)

**Legacy Tables Found:**
- `users` (old schema)
- `agents` (legacy)
- `purchases` (legacy)
- `call_history` (legacy)
- `rag_documents` (legacy)
- `phone_numbers` (legacy, different structure)
- `call_logs` (legacy, different structure)

## Solution for NEW Project "aidevelo.prod"

### Option A: Fresh Start (RECOMMENDED)
If "aidevelo.prod" is a NEW project:
1. Ensure MCP points to aidevelo.prod
2. Apply schema - should work without conflicts
3. No legacy tables to worry about

### Option B: If Legacy Tables Exist in aidevelo.prod
If aidevelo.prod already has legacy tables:

**Step 1: Rename Legacy Tables**
```sql
ALTER TABLE users RENAME TO users_legacy;
ALTER TABLE agents RENAME TO agents_legacy;
ALTER TABLE purchases RENAME TO purchases_legacy;
ALTER TABLE call_history RENAME TO call_history_legacy;
ALTER TABLE rag_documents RENAME TO rag_documents_legacy;
ALTER TABLE phone_numbers RENAME TO phone_numbers_legacy;
ALTER TABLE call_logs RENAME TO call_logs_legacy;
```

**Step 2: Apply New Schema**
Run `server/db/schema.sql` in Supabase SQL Editor

**Step 3: Verify**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema='public' 
AND table_name IN (
  'organizations','users','locations','agent_configs',
  'phone_numbers','google_calendar_integrations','call_logs','porting_requests'
)
ORDER BY table_name;
```

## Next Steps

1. **Confirm MCP Connection:**
   - Check if MCP points to aidevelo.prod
   - If not, update MCP configuration

2. **Check aidevelo.prod Tables:**
   ```sql
   SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;
   ```

3. **If Clean (no legacy tables):**
   - Apply schema directly via MCP or SQL Editor

4. **If Legacy Tables Exist:**
   - Rename them first (see Option B above)
   - Then apply schema

## Verification Query
After schema apply, run:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema='public' 
AND table_name IN (
  'organizations','users','locations','agent_configs',
  'phone_numbers','google_calendar_integrations','call_logs','porting_requests'
)
ORDER BY table_name;
```

Expected: 8 tables listed
