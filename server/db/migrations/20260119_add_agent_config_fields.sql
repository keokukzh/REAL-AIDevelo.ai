-- Add missing fields to agent_configs
ALTER TABLE agent_configs
  ADD COLUMN IF NOT EXISTS eleven_agent_id TEXT,
  ADD COLUMN IF NOT EXISTS greeting_template TEXT,
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS primary_locale TEXT DEFAULT 'de-CH',
  ADD COLUMN IF NOT EXISTS recording_consent BOOLEAN DEFAULT true;
