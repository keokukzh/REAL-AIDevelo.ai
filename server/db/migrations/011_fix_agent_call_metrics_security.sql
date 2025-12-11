-- Recreate view without SECURITY DEFINER so it runs with caller privileges (RLS respected)
DO $$
DECLARE
  v_def text;
BEGIN
  -- Get current view definition
  SELECT pg_get_viewdef('public.agent_call_metrics'::regclass, true) INTO v_def;

  IF v_def IS NULL THEN
    RAISE NOTICE 'View public.agent_call_metrics not found, skipping';
    RETURN;
  END IF;

  -- Drop existing view (may have SECURITY DEFINER)
  EXECUTE 'DROP VIEW IF EXISTS public.agent_call_metrics CASCADE';

  -- Recreate as SECURITY INVOKER (default) using the same SELECT body
  EXECUTE 'CREATE VIEW public.agent_call_metrics AS ' || v_def;

  RAISE NOTICE 'View public.agent_call_metrics recreated without SECURITY DEFINER';
END $$;

