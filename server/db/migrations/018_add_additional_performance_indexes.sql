-- Migration: Add additional performance indexes
-- Date: 2025-01-XX
-- Description: Add missing indexes for frequently queried columns to improve query performance

-- Index on call_logs.outcome for filtering by outcome
CREATE INDEX IF NOT EXISTS idx_call_logs_outcome ON call_logs(outcome) WHERE outcome IS NOT NULL;

-- Index on call_logs.location_id for single-column lookups (if not covered by composite)
-- Note: Composite index idx_call_logs_location_started already covers location_id + started_at
-- This single-column index helps with queries that only filter by location_id
CREATE INDEX IF NOT EXISTS idx_call_logs_location_id ON call_logs(location_id);

-- Index on call_logs.started_at for date range queries without location filter
CREATE INDEX IF NOT EXISTS idx_call_logs_started_at ON call_logs(started_at DESC);

-- Composite index for analytics queries: location_id + outcome + started_at
CREATE INDEX IF NOT EXISTS idx_call_logs_location_outcome_started ON call_logs(location_id, outcome, started_at DESC);

-- Index on users.supabase_user_id (should already exist as UNIQUE, but ensure it's indexed)
-- The UNIQUE constraint already creates an index, but we'll verify
-- CREATE INDEX IF NOT EXISTS idx_users_supabase_user_id ON users(supabase_user_id); -- Already indexed via UNIQUE

-- Index on phone_numbers.location_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_phone_numbers_location_id ON phone_numbers(location_id);

-- Index on google_calendar_integrations.location_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_location_id ON google_calendar_integrations(location_id);

-- Composite index for calendar integrations: location_id + provider
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_location_provider ON google_calendar_integrations(location_id, provider);

-- Index on locations.org_id for organization-based queries
CREATE INDEX IF NOT EXISTS idx_locations_org_id ON locations(org_id);

-- Index on users.org_id for organization-based queries
CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id);

-- Index on agent_configs.location_id (should already exist via UNIQUE, but verify)
-- The UNIQUE constraint already creates an index

-- Analyze tables after index creation to update statistics
ANALYZE call_logs;
ANALYZE phone_numbers;
ANALYZE google_calendar_integrations;
ANALYZE locations;
ANALYZE users;
