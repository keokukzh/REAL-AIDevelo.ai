-- Migration: Normalize call_logs table for analytics and dashboard
-- Description: Ensures call_logs table has all columns required by Analytics and Dashboard controllers

-- Ensure set_updated_at function exists
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Create call_logs if not exists (with modern schema)
CREATE TABLE IF NOT EXISTS call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID, -- Will add FK if locations exists
  call_sid TEXT UNIQUE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound', 'test')),
  from_e164 TEXT,
  to_e164 TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_sec INTEGER,
  outcome TEXT,
  notes_json JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add columns if missing (in case table was created by older migration)
DO $$
BEGIN
  -- location_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'location_id') THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'locations') THEN
      ALTER TABLE call_logs ADD COLUMN location_id UUID REFERENCES locations(id) ON DELETE CASCADE;
    ELSE
      ALTER TABLE call_logs ADD COLUMN location_id UUID;
    END IF;
  END IF;

  -- call_sid
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'call_sid') THEN
    ALTER TABLE call_logs ADD COLUMN call_sid TEXT UNIQUE;
  END IF;

  -- from_e164
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'from_e164') THEN
    ALTER TABLE call_logs ADD COLUMN from_e164 TEXT;
  END IF;

  -- to_e164
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'to_e164') THEN
    ALTER TABLE call_logs ADD COLUMN to_e164 TEXT;
  END IF;

  -- started_at (rename from start_time if exists)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'start_time') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'started_at') THEN
    ALTER TABLE call_logs RENAME COLUMN start_time TO started_at;
  END IF;

  -- ended_at (rename from end_time if exists)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'end_time') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'ended_at') THEN
    ALTER TABLE call_logs RENAME COLUMN end_time TO ended_at;
  END IF;

  -- duration_sec (rename from duration if exists)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'duration') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'duration_sec') THEN
    ALTER TABLE call_logs RENAME COLUMN duration TO duration_sec;
  END IF;

  -- outcome (rename from status if exists OR add if missing)
  -- Note: if both outcome and status exist, we keep both for now
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'outcome') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'status') THEN
       ALTER TABLE call_logs ADD COLUMN outcome TEXT;
       EXECUTE 'UPDATE call_logs SET outcome = status WHERE outcome IS NULL';
    ELSE
       ALTER TABLE call_logs ADD COLUMN outcome TEXT;
    END IF;
  END IF;

  -- notes_json
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'notes_json') THEN
    ALTER TABLE call_logs ADD COLUMN notes_json JSONB DEFAULT '{}'::JSONB;
    
    -- Migrate transcription to notes_json if exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'transcription') THEN
       EXECUTE 'UPDATE call_logs SET notes_json = jsonb_set(notes_json, ''{transcript}'', to_jsonb(transcription)) WHERE transcription IS NOT NULL';
    END IF;
    -- Migrate recording_url to notes_json if exists (although controller uses it from column too)
  END IF;

END $$;

-- 3. Ensure Indexes
CREATE INDEX IF NOT EXISTS idx_call_logs_location_id ON call_logs(location_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_call_sid ON call_logs(call_sid);
CREATE INDEX IF NOT EXISTS idx_call_logs_started_at ON call_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_logs_location_started ON call_logs(location_id, started_at DESC);

-- 4. Ensure Trigger
DROP TRIGGER IF EXISTS trg_call_logs_updated ON call_logs;
CREATE TRIGGER trg_call_logs_updated
  BEFORE UPDATE ON call_logs
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- 5. Verification of other critical tables from user request
-- These should already exist but we ensure they have basic structure

-- users (ensure public prefix and role column)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY, -- Usually from Supabase Auth
  email TEXT UNIQUE,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure role column exists if table was created by older migration
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'role'
  ) THEN
    ALTER TABLE public.users ADD COLUMN role TEXT DEFAULT 'user';
  END IF;
END $$;

-- scheduled_reports
CREATE TABLE IF NOT EXISTS scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL, -- FK to locations
  enabled BOOLEAN DEFAULT true,
  frequency TEXT NOT NULL, -- daily, weekly, monthly
  timezone TEXT DEFAULT 'Europe/Zurich',
  recipients TEXT[] DEFAULT '{}',
  filters JSONB DEFAULT '{}'::JSONB,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- user_subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL,
  plan_id TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- 6. organizations
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. locations
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
