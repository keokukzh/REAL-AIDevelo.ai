-- Migration: Add performance indexes
-- Date: 2025-01-27
-- Description: Add composite indexes and GIN indexes for JSONB queries to improve query performance

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_call_logs_location_started ON call_logs(location_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_status_location ON phone_numbers(status, location_id) WHERE status = 'connected';

-- Partial index for agent configs in setup (filters incomplete setups)
CREATE INDEX IF NOT EXISTS idx_agent_configs_setup_state ON agent_configs(setup_state) WHERE setup_state != 'complete';

-- GIN indexes for JSONB queries
CREATE INDEX IF NOT EXISTS idx_agent_configs_goals_gin ON agent_configs USING GIN (goals_json);
CREATE INDEX IF NOT EXISTS idx_agent_configs_services_gin ON agent_configs USING GIN (services_json);
CREATE INDEX IF NOT EXISTS idx_call_logs_notes_gin ON call_logs USING GIN (notes_json);
CREATE INDEX IF NOT EXISTS idx_porting_requests_docs_gin ON porting_requests USING GIN (docs_json);
