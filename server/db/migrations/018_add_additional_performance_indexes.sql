-- Migration: Add additional performance indexes
-- Date: 2025-01-XX
-- Description: Add missing indexes for frequently queried columns to improve query performance

DO $$
BEGIN
  -- Index on call_logs.outcome for filtering by outcome (only if column exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'call_logs') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'outcome') THEN
      CREATE INDEX IF NOT EXISTS idx_call_logs_outcome ON call_logs(outcome) WHERE outcome IS NOT NULL;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'location_id') THEN
      CREATE INDEX IF NOT EXISTS idx_call_logs_location_id ON call_logs(location_id);
      CREATE INDEX IF NOT EXISTS idx_call_logs_started_at ON call_logs(started_at DESC);
      
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'outcome') THEN
        CREATE INDEX IF NOT EXISTS idx_call_logs_location_outcome_started ON call_logs(location_id, outcome, started_at DESC);
      END IF;
    END IF;
  END IF;
  
  -- Index on phone_numbers.location_id
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'phone_numbers') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'phone_numbers' AND column_name = 'location_id') THEN
      CREATE INDEX IF NOT EXISTS idx_phone_numbers_location_id ON phone_numbers(location_id);
    END IF;
  END IF;
  
  -- Index on google_calendar_integrations.location_id
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'google_calendar_integrations') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'google_calendar_integrations' AND column_name = 'location_id') THEN
      CREATE INDEX IF NOT EXISTS idx_calendar_integrations_location_id ON google_calendar_integrations(location_id);
      
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'google_calendar_integrations' AND column_name = 'provider') THEN
        CREATE INDEX IF NOT EXISTS idx_calendar_integrations_location_provider ON google_calendar_integrations(location_id, provider);
      END IF;
    END IF;
  END IF;
  
  -- Index on locations.org_id
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'locations') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'org_id') THEN
      CREATE INDEX IF NOT EXISTS idx_locations_org_id ON locations(org_id);
    END IF;
  END IF;
  
  -- Index on users.org_id
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'org_id') THEN
      CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id);
    END IF;
  END IF;
END $$;

-- Analyze tables after index creation to update statistics (only if tables exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'call_logs') THEN
    ANALYZE call_logs;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'phone_numbers') THEN
    ANALYZE phone_numbers;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'google_calendar_integrations') THEN
    ANALYZE google_calendar_integrations;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'locations') THEN
    ANALYZE locations;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    ANALYZE users;
  END IF;
END $$;
