-- Migration: Create logging and audit tables
-- Description: Add call_logs and audit_logs tables for monitoring, metrics, and GDPR/nDSG compliance

-- Call Logs Table (for analytics and monitoring)
CREATE TABLE IF NOT EXISTS call_logs (
  id TEXT PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL,
  phone_number TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration INTEGER, -- seconds
  status TEXT NOT NULL CHECK (status IN ('initiated', 'connected', 'failed', 'completed')),
  recording_url TEXT,
  transcription TEXT,
  success_rate NUMERIC(5,2),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX idx_call_logs_agent_id ON call_logs(agent_id);
CREATE INDEX idx_call_logs_customer_id ON call_logs(customer_id);
CREATE INDEX idx_call_logs_start_time ON call_logs(start_time DESC);
CREATE INDEX idx_call_logs_status ON call_logs(status);

-- Audit Logs Table (for compliance and transparency)
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'create_agent', 'update_config', 'delete_data', 'export_data', etc.
  resource_type TEXT NOT NULL, -- 'agent', 'call', 'user_data', 'config'
  resource_id TEXT NOT NULL,
  details JSONB DEFAULT '{}', -- Additional context
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for audit log queries
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Retention Policy: Auto-delete old call logs after 90 days
-- (Can be configured per agent/customer)
-- NOTE: Audit logs should be kept for 1+ year for compliance

-- View: Monthly call metrics per agent
CREATE OR REPLACE VIEW agent_call_metrics AS
SELECT
  agent_id,
  DATE_TRUNC('month', start_time) as month,
  COUNT(*) as total_calls,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_calls,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_calls,
  AVG(EXTRACT(EPOCH FROM (end_time - start_time))) as avg_duration_seconds,
  AVG(success_rate) as avg_success_rate,
  MAX(start_time) as last_call
FROM call_logs
GROUP BY agent_id, DATE_TRUNC('month', start_time)
ORDER BY month DESC;
