-- AIDevelo Supabase Schema
-- Run this in Supabase SQL Editor

-- Enable extensions if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Organizations (multi-tenant root)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Default Org',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users (linked to Supabase Auth via supabase_user_id)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  supabase_user_id UUID NOT NULL UNIQUE,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Locations (business locations per org)
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Hauptstandort',
  business_type TEXT,
  timezone TEXT NOT NULL DEFAULT 'Europe/Zurich',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agent Configs (one per location)
CREATE TABLE IF NOT EXISTS agent_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL UNIQUE REFERENCES locations(id) ON DELETE CASCADE,
  eleven_agent_id TEXT,
  setup_state TEXT NOT NULL DEFAULT 'needs_persona',
  persona_gender TEXT,
  persona_age_range TEXT,
  goals_json JSONB NOT NULL DEFAULT '[]'::JSONB,
  services_json JSONB NOT NULL DEFAULT '[]'::JSONB,
  business_type TEXT NOT NULL DEFAULT 'unknown',
  admin_test_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Phone Numbers (CH numbers per location)
CREATE TABLE IF NOT EXISTS phone_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  mode TEXT NOT NULL DEFAULT 'aidvelo_number', -- aidvelo_number | forward | porting
  twilio_number_sid TEXT,
  e164 TEXT,
  customer_public_number TEXT,
  status TEXT NOT NULL DEFAULT 'not_connected', -- not_connected | connected
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Google Calendar Integrations (one per location)
CREATE TABLE IF NOT EXISTS google_calendar_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL UNIQUE REFERENCES locations(id) ON DELETE CASCADE,
  calendar_id TEXT NOT NULL DEFAULT 'primary',
  connected_email TEXT,
  refresh_token_encrypted TEXT NOT NULL,
  access_token TEXT,
  expiry_ts TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Call Logs
CREATE TABLE IF NOT EXISTS call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  call_sid TEXT NOT NULL UNIQUE,
  direction TEXT NOT NULL, -- inbound | outbound
  from_e164 TEXT,
  to_e164 TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_sec INT,
  outcome TEXT,
  notes_json JSONB NOT NULL DEFAULT '{}'::JSONB
);

-- Porting Requests
CREATE TABLE IF NOT EXISTS porting_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  number_e164 TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted', -- submitted | in_review | in_progress | completed | rejected
  docs_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Updated_at triggers
DROP TRIGGER IF EXISTS trg_agent_configs_updated ON agent_configs;
CREATE TRIGGER trg_agent_configs_updated
  BEFORE UPDATE ON agent_configs
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_phone_numbers_updated ON phone_numbers;
CREATE TRIGGER trg_phone_numbers_updated
  BEFORE UPDATE ON phone_numbers
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_google_calendar_integrations_updated ON google_calendar_integrations;
CREATE TRIGGER trg_google_calendar_integrations_updated
  BEFORE UPDATE ON google_calendar_integrations
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_org ON users(org_id);
CREATE INDEX IF NOT EXISTS idx_users_supabase_user_id ON users(supabase_user_id);
CREATE INDEX IF NOT EXISTS idx_locations_org ON locations(org_id);
CREATE INDEX IF NOT EXISTS idx_agent_configs_location ON agent_configs(location_id);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_location ON phone_numbers(location_id);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_e164 ON phone_numbers(e164);
CREATE INDEX IF NOT EXISTS idx_call_logs_location ON call_logs(location_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_started_at ON call_logs(started_at);
CREATE INDEX IF NOT EXISTS idx_google_calendar_integrations_location ON google_calendar_integrations(location_id);
CREATE INDEX IF NOT EXISTS idx_porting_requests_location ON porting_requests(location_id);


