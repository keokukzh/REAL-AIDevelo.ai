  -- AIDevelo Security Hardening SQL
  -- Run this in Supabase SQL Editor (aidevelo.prod)
  -- 
  -- Purpose:
  -- 1. Enable Row Level Security (RLS) on all public tables
  -- 2. Revoke direct table access from anon/authenticated roles (backend uses service_role)
  -- 3. Fix set_updated_at() function with safe search_path
  --
  -- Architecture:
  -- - Backend uses SUPABASE_SERVICE_ROLE_KEY (bypasses RLS)
  -- - Frontend uses Supabase anon key only for auth (no direct table access)
  -- - All data access goes through backend API

  -- ============================================================================
  -- 1. ENABLE RLS ON ALL TABLES
  -- ============================================================================

  ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
  ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
  ALTER TABLE agent_configs ENABLE ROW LEVEL SECURITY;
  ALTER TABLE phone_numbers ENABLE ROW LEVEL SECURITY;
  ALTER TABLE google_calendar_integrations ENABLE ROW LEVEL SECURITY;
  ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
  ALTER TABLE porting_requests ENABLE ROW LEVEL SECURITY;

  -- ============================================================================
  -- 2. REVOKE DIRECT TABLE ACCESS FROM ANON AND AUTHENTICATED
  -- ============================================================================
  -- Since backend uses service_role (bypasses RLS), we can safely revoke
  -- direct access from anon/authenticated roles. This prevents accidental
  -- exposure via PostgREST if someone tries to access tables directly.

  REVOKE ALL ON organizations FROM anon, authenticated;
  REVOKE ALL ON users FROM anon, authenticated;
  REVOKE ALL ON locations FROM anon, authenticated;
  REVOKE ALL ON agent_configs FROM anon, authenticated;
  REVOKE ALL ON phone_numbers FROM anon, authenticated;
  REVOKE ALL ON google_calendar_integrations FROM anon, authenticated;
  REVOKE ALL ON call_logs FROM anon, authenticated;
  REVOKE ALL ON porting_requests FROM anon, authenticated;

  -- ============================================================================
  -- 3. FIX set_updated_at() FUNCTION WITH SAFE SEARCH_PATH
  -- ============================================================================
  -- Security Advisor warns about mutable search_path in functions.
  -- Fix by explicitly setting search_path to public, pg_catalog.

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

  -- Note: Triggers don't need to be recreated - they reference the function by name.

  -- ============================================================================
  -- VERIFICATION QUERIES (run these after applying to verify)
  -- ============================================================================
  -- 
  -- Check RLS is enabled:
  -- SELECT tablename, rowsecurity 
  -- FROM pg_tables 
  -- WHERE schemaname = 'public' 
  --   AND tablename IN ('organizations', 'users', 'locations', 'agent_configs', 
  --                     'phone_numbers', 'google_calendar_integrations', 
  --                     'call_logs', 'porting_requests');
  -- Expected: rowsecurity = true for all 8 tables
  --
  -- Check function search_path:
  -- SELECT pg_get_functiondef(oid) 
  -- FROM pg_proc 
  -- WHERE proname = 'set_updated_at';
  -- Expected: Should contain "SET search_path = public, pg_catalog"
  --
  -- Check permissions:
  -- SELECT grantee, table_name, privilege_type 
  -- FROM information_schema.role_table_grants 
  -- WHERE table_schema = 'public' 
  --   AND table_name IN ('organizations', 'users', 'locations', 'agent_configs', 
  --                      'phone_numbers', 'google_calendar_integrations', 
  --                      'call_logs', 'porting_requests')
  --   AND grantee IN ('anon', 'authenticated');
  -- Expected: No rows (all permissions revoked)

  -- ============================================================================
  -- ROLLBACK (if needed)
  -- ============================================================================
  -- 
  -- To rollback RLS:
  -- ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
  -- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
  -- ALTER TABLE locations DISABLE ROW LEVEL SECURITY;
  -- ALTER TABLE agent_configs DISABLE ROW LEVEL SECURITY;
  -- ALTER TABLE phone_numbers DISABLE ROW LEVEL SECURITY;
  -- ALTER TABLE google_calendar_integrations DISABLE ROW LEVEL SECURITY;
  -- ALTER TABLE call_logs DISABLE ROW LEVEL SECURITY;
  -- ALTER TABLE porting_requests DISABLE ROW LEVEL SECURITY;
  --
  -- To restore permissions (not recommended):
  -- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;

