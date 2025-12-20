-- Add booking and greeting configuration fields to agent_configs
-- These fields allow per-location customization of agent behavior

-- Only run if agent_configs table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agent_configs') THEN
    ALTER TABLE agent_configs
      ADD COLUMN IF NOT EXISTS greeting_template TEXT NULL,
      ADD COLUMN IF NOT EXISTS company_name TEXT NULL,
      ADD COLUMN IF NOT EXISTS booking_required_fields_json JSONB NOT NULL DEFAULT '[]'::JSONB,
      ADD COLUMN IF NOT EXISTS booking_default_duration_min INT NOT NULL DEFAULT 30;

    -- Add comment for documentation
    COMMENT ON COLUMN agent_configs.greeting_template IS 'Custom greeting template with {{company_name}} placeholder. Example: "Grüezi, hier ist {{company_name}}. Wie kann ich helfen?"';
    COMMENT ON COLUMN agent_configs.company_name IS 'Company name used in greetings and dynamic variables';
    COMMENT ON COLUMN agent_configs.booking_required_fields_json IS 'Array of required field names for appointment booking (e.g. ["name", "phone", "service", "preferredTime", "timezone"])';
    COMMENT ON COLUMN agent_configs.booking_default_duration_min IS 'Default appointment duration in minutes';

    -- Create index for JSONB queries on booking_required_fields_json
    CREATE INDEX IF NOT EXISTS idx_agent_configs_booking_fields_gin ON agent_configs USING GIN (booking_required_fields_json);
  END IF;
END $$;
