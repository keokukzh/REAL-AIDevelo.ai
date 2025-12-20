-- Migration: Add performance indexes
-- Date: 2025-01-27
-- Description: Add composite indexes and GIN indexes for JSONB queries to improve query performance

-- Composite indexes for common query patterns
-- Only create if tables and columns exist (some added in later migrations)
DO $$
BEGIN
  -- call_logs indexes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'call_logs') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'location_id') THEN
      CREATE INDEX IF NOT EXISTS idx_call_logs_location_started ON call_logs(location_id, started_at DESC);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'notes_json') THEN
      CREATE INDEX IF NOT EXISTS idx_call_logs_notes_gin ON call_logs USING GIN (notes_json);
    END IF;
  END IF;
  
  -- phone_numbers indexes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'phone_numbers') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'phone_numbers' AND column_name = 'location_id') THEN
      CREATE INDEX IF NOT EXISTS idx_phone_numbers_status_location ON phone_numbers(status, location_id) WHERE status = 'connected';
    END IF;
  END IF;
  
  -- agent_configs indexes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agent_configs') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agent_configs' AND column_name = 'setup_state') THEN
      CREATE INDEX IF NOT EXISTS idx_agent_configs_setup_state ON agent_configs(setup_state) WHERE setup_state != 'complete';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agent_configs' AND column_name = 'goals_json') THEN
      CREATE INDEX IF NOT EXISTS idx_agent_configs_goals_gin ON agent_configs USING GIN (goals_json);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agent_configs' AND column_name = 'services_json') THEN
      CREATE INDEX IF NOT EXISTS idx_agent_configs_services_gin ON agent_configs USING GIN (services_json);
    END IF;
  END IF;
  
  -- porting_requests indexes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'porting_requests') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'porting_requests' AND column_name = 'docs_json') THEN
      CREATE INDEX IF NOT EXISTS idx_porting_requests_docs_gin ON porting_requests USING GIN (docs_json);
    END IF;
  END IF;
END $$;
