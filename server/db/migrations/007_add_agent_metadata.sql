-- Add metadata column to agents for default-agent and ownership flags
ALTER TABLE agents
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Useful indexes for default agents and lookups by user
CREATE INDEX IF NOT EXISTS idx_agents_metadata_default ON agents ((metadata ->> 'isDefaultAgent'));
CREATE INDEX IF NOT EXISTS idx_agents_metadata_user_id ON agents ((metadata ->> 'userId'));
