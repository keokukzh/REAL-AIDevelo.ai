# Supabase Security Hardening Guide

**Project:** aidevelo.prod  
**Purpose:** Fix Security Advisor findings (RLS disabled, function search_path mutable)

---

## Overview

This guide applies security hardening to the AIDevelo Supabase database to address Security Advisor warnings:

1. **RLS Disabled:** Row Level Security is disabled on public tables
2. **Function Search Path Mutable:** `set_updated_at()` function has mutable search_path
3. **Leaked Password Protection:** Dashboard toggle (manual step)

---

## Architecture Context

**Important:** Our architecture does NOT rely on PostgREST table access from the browser:

- ✅ **Backend:** Uses `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS, has full access)
- ✅ **Frontend:** Uses Supabase anon key only for authentication (no direct table access)
- ✅ **Data Access:** All data access goes through backend API endpoints

**Why this is safe:**
- RLS is enabled for defense-in-depth (even though service_role bypasses it)
- Revoking permissions from `anon`/`authenticated` prevents accidental exposure
- Backend continues to work normally (service_role has full access)

---

## Step 1: Apply Security Hardening SQL

**File:** `server/db/security_hardening.sql`

**Location:** Supabase Dashboard → aidevelo.prod → SQL Editor

**Action:** Copy and paste the entire contents of `server/db/security_hardening.sql` into the SQL Editor and run it.

**What it does:**
1. Enables RLS on all 8 public tables
2. Revokes direct table access from `anon` and `authenticated` roles
3. Fixes `set_updated_at()` function with safe `search_path`

**Expected Output:**
```
Success. No rows returned
```

---

## Step 2: Verify RLS is Enabled

**Run this query in Supabase SQL Editor:**

```sql
SELECT 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'organizations', 
    'users', 
    'locations', 
    'agent_configs', 
    'phone_numbers', 
    'google_calendar_integrations', 
    'call_logs', 
    'porting_requests'
  )
ORDER BY tablename;
```

**Expected Result:**
```
tablename                        | rowsecurity
--------------------------------|------------
agent_configs                   | true
call_logs                       | true
google_calendar_integrations    | true
locations                       | true
organizations                    | true
phone_numbers                    | true
porting_requests                | true
users                           | true
```

**All 8 tables should have `rowsecurity = true`**

---

## Step 3: Verify Function Search Path

**Run this query in Supabase SQL Editor:**

```sql
SELECT 
  proname,
  pg_get_functiondef(oid) as definition
FROM pg_proc 
WHERE proname = 'set_updated_at' 
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
LIMIT 1;
```

**Expected Result:**
The `definition` column should contain:
```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
```

**Key Check:** The definition should include `SET search_path = public, pg_catalog`

---

## Step 4: Verify Permissions Revoked

**Run this query in Supabase SQL Editor:**

```sql
SELECT 
  grantee, 
  table_name, 
  privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name IN (
    'organizations', 
    'users', 
    'locations', 
    'agent_configs', 
    'phone_numbers', 
    'google_calendar_integrations', 
    'call_logs', 
    'porting_requests'
  )
  AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee;
```

**Expected Result:**
```
(0 rows)
```

**No rows should be returned** (all permissions revoked from `anon` and `authenticated`)

---

## Step 5: Enable Leaked Password Protection (Dashboard)

**Location:** Supabase Dashboard → aidevelo.prod → Authentication → Policies

**Action:**
1. Navigate to **Authentication** → **Policies**
2. Find **"Leaked password protection"** toggle
3. Enable it (toggle ON)

**Note:** This is a dashboard-only setting (no SQL required)

---

## Step 6: Verify Backend Still Works

**Test the preflight endpoint:**

```bash
curl https://aidevelo.ai/api/db/preflight
```

**Expected Response:**
```json
{
  "ok": true,
  "missing": [],
  "warnings": [
    "Verify set_updated_at has SET search_path = public, pg_catalog (run security_hardening.sql)",
    "Verify RLS is enabled on all tables (run verification queries from docs/SUPABASE_SECURITY_HARDENING.md)"
  ],
  "projectUrl": "https://rckuwfcsqwwylffecwur.supabase.co",
  "timestamp": "2025-01-XX..."
}
```

**Note:** Warnings are informational (preflight can't verify RLS/function via PostgREST). If you've run the verification queries above and they pass, you can ignore these warnings.

---

## Rollback (If Needed)

**To disable RLS (not recommended):**

```sql
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE agent_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE phone_numbers DISABLE ROW LEVEL SECURITY;
ALTER TABLE google_calendar_integrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE porting_requests DISABLE ROW LEVEL SECURITY;
```

**To restore permissions (not recommended):**

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
```

**Note:** Rollback is only needed if you encounter issues. The backend should continue working normally since it uses `service_role` (bypasses RLS).

---

## Security Advisor Status

After applying all steps:

- ✅ **RLS Enabled:** All 8 tables have RLS enabled
- ✅ **Function Search Path:** `set_updated_at()` has safe `search_path`
- ✅ **Permissions:** `anon`/`authenticated` have no direct table access
- ✅ **Leaked Password Protection:** Enabled in dashboard

**Security Advisor should show:** All errors resolved, only informational warnings (if any)

---

## Troubleshooting

### Backend API Still Works?

**Yes!** The backend uses `SUPABASE_SERVICE_ROLE_KEY` which:
- Bypasses RLS (has full access)
- Has all permissions (not affected by revocations)
- Continues to work normally

### Frontend Broken?

**No!** The frontend:
- Uses Supabase anon key only for authentication
- Does NOT access tables directly (all data via backend API)
- Should continue working normally

### Preflight Shows Warnings?

**Expected!** The preflight endpoint can't verify RLS/function search_path via PostgREST. If you've run the verification queries above and they pass, you can safely ignore the warnings.

---

## Files Changed

- ✅ `server/db/security_hardening.sql` - Security hardening SQL
- ✅ `server/src/services/dbPreflight.ts` - Added RLS/function warnings
- ✅ `server/src/routes/dbRoutes.ts` - Updated response to include warnings
- ✅ `docs/SUPABASE_SECURITY_HARDENING.md` - This documentation

---

## Next Steps

1. ✅ Apply `security_hardening.sql` in Supabase SQL Editor
2. ✅ Run verification queries (Steps 2-4)
3. ✅ Enable leaked password protection in dashboard (Step 5)
4. ✅ Verify backend still works (Step 6)
5. ✅ Check Security Advisor - should show all errors resolved

**Status:** Ready for production ✅

