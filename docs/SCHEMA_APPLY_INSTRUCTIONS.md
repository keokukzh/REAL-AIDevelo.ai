# Schema Apply Instructions for aidevelo.prod

## Current Status

**MCP Connection:** Still pointing to old project (`pdxdgfxhpyefqyouotat.supabase.co`)

**Required Tables Check:**
- Need to verify in NEW project "aidevelo.prod"

## Steps to Apply Schema

### 1. Switch MCP Connection to aidevelo.prod
Update your Supabase MCP configuration to point to the new project:
- Project Reference: `aidevelo.prod` (or actual project-ref)
- Get URL from: Supabase Dashboard → aidevelo.prod → Settings → API → Project URL

### 2. Check Existing Tables
Run in Supabase SQL Editor (aidevelo.prod):
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

### 3. Apply Schema
Copy entire content of `server/db/schema.sql` and run in Supabase SQL Editor (aidevelo.prod).

**File:** `server/db/schema.sql`

**Expected Result:**
- All 8 required tables created
- Triggers created
- Indexes created
- No errors

### 4. Verify Schema
Run verification query:
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

**Expected Output:** 8 tables listed

### 5. Check for Legacy Tables
If you see legacy tables (agents, purchases, call_history, rag_documents), report them but DO NOT delete:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema='public' 
AND table_name IN ('agents','purchases','call_history','rag_documents')
ORDER BY table_name;
```

## Required Tables (New Schema)

1. ✅ `organizations` - Multi-tenant root
2. ✅ `users` - Users with org_id and supabase_user_id
3. ✅ `locations` - Business locations per org
4. ✅ `agent_configs` - Agent configuration per location
5. ✅ `phone_numbers` - Phone numbers per location
6. ✅ `google_calendar_integrations` - Calendar integrations per location
7. ✅ `call_logs` - Call logs per location
8. ✅ `porting_requests` - Number porting requests

## After Schema Apply

Run preflight check:
```bash
curl http://localhost:5000/api/db/preflight
```

Expected: `{"ok": true, "missing": []}`
