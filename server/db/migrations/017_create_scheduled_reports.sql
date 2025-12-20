-- Migration: Create scheduled_reports table for Phase 4.11
-- Scheduled PDF reports per location via cron + email

-- Only create if locations table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'locations') THEN
    CREATE TABLE IF NOT EXISTS scheduled_reports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
      enabled BOOLEAN NOT NULL DEFAULT true,
      frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
      timezone TEXT NOT NULL DEFAULT 'Europe/Zurich',
      recipients TEXT[] NOT NULL,
      filters JSONB NOT NULL DEFAULT '{}'::JSONB,
      last_run_at TIMESTAMPTZ,
      next_run_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_scheduled_reports_location ON scheduled_reports(location_id);
    CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next_run ON scheduled_reports(next_run_at) WHERE enabled = true;

    -- Updated_at trigger
    DROP TRIGGER IF EXISTS trg_scheduled_reports_updated ON scheduled_reports;
    CREATE TRIGGER trg_scheduled_reports_updated
      BEFORE UPDATE ON scheduled_reports
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;
