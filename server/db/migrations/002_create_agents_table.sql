-- Create agents table for storing voice agents
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eleven_labs_agent_id TEXT,
  business_profile JSONB NOT NULL,
  config JSONB NOT NULL,
  subscription JSONB,
  telephony JSONB,
  voice_cloning JSONB,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'configuring', 'production_ready', 'inactive', 'pending_activation', 'active', 'live')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_eleven_labs_id ON agents(eleven_labs_agent_id) WHERE eleven_labs_agent_id IS NOT NULL;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

