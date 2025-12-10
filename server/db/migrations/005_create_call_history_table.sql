-- Create call history table for storing call records
CREATE TABLE IF NOT EXISTS call_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  session_id TEXT UNIQUE NOT NULL,
  caller_number TEXT,
  duration_seconds INTEGER,
  status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'ringing', 'answered', 'completed', 'failed', 'cancelled')),
  recording_url TEXT,
  transcript TEXT,
  metadata JSONB,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_call_history_agent_id ON call_history(agent_id);
CREATE INDEX IF NOT EXISTS idx_call_history_session_id ON call_history(session_id);
CREATE INDEX IF NOT EXISTS idx_call_history_started_at ON call_history(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_history_status ON call_history(status);

