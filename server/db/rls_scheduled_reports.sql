-- RLS and index for scheduled_reports
-- Run this in Supabase SQL Editor (Primary Database) to add UPDATE/DELETE policies and an index.

-- Enable RLS if not already enabled
ALTER TABLE IF EXISTS public.scheduled_reports ENABLE ROW LEVEL SECURITY;

-- SELECT policy (create only if missing)
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='scheduled_reports' AND policyname='scheduled_reports_org_select'
  ) THEN
    EXECUTE $sql$
      CREATE POLICY scheduled_reports_org_select ON public.scheduled_reports
        FOR SELECT
        TO authenticated
        USING (
          (SELECT org_id FROM public.locations WHERE locations.id = scheduled_reports.location_id) = (auth.jwt() ->> 'org_id')::uuid
        );
    $sql$;
  END IF;
END
$do$;

-- INSERT policy (create only if missing)
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='scheduled_reports' AND policyname='scheduled_reports_org_insert'
  ) THEN
    EXECUTE $sql$
      CREATE POLICY scheduled_reports_org_insert ON public.scheduled_reports
        FOR INSERT
        TO authenticated
        WITH CHECK (
          (SELECT org_id FROM public.locations WHERE locations.id = NEW.location_id) = (auth.jwt() ->> 'org_id')::uuid
        );
    $sql$;
  END IF;
END
$do$;

-- UPDATE policy (create only if missing)
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='scheduled_reports' AND policyname='scheduled_reports_org_update'
  ) THEN
    EXECUTE $sql$
      CREATE POLICY scheduled_reports_org_update ON public.scheduled_reports
        FOR UPDATE
        TO authenticated
        USING (
          (SELECT org_id FROM public.locations WHERE locations.id = scheduled_reports.location_id) = (auth.jwt() ->> 'org_id')::uuid
        )
        WITH CHECK (
          (SELECT org_id FROM public.locations WHERE locations.id = NEW.location_id) = (auth.jwt() ->> 'org_id')::uuid
        );
    $sql$;
  END IF;
END
$do$;

-- DELETE policy (create only if missing)
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='scheduled_reports' AND policyname='scheduled_reports_org_delete'
  ) THEN
    EXECUTE $sql$
      CREATE POLICY scheduled_reports_org_delete ON public.scheduled_reports
        FOR DELETE
        TO authenticated
        USING (
          (SELECT org_id FROM public.locations WHERE locations.id = scheduled_reports.location_id) = (auth.jwt() ->> 'org_id')::uuid
        );
    $sql$;
  END IF;
END
$do$;

-- Index to speed lookups by location
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_location_id ON public.scheduled_reports(location_id);

-- Verification queries (run after applying):
-- SELECT policyname, permissive, roles, cmd FROM pg_policies WHERE tablename = 'scheduled_reports';
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'scheduled_reports';
