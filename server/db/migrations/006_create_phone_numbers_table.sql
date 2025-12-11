-- Phone numbers for telephony routing
CREATE TABLE IF NOT EXISTS phone_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_sid TEXT NOT NULL,
  number TEXT NOT NULL UNIQUE,
  country TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'active', 'inactive')),
  capabilities JSONB DEFAULT '{"voice":true}',
  assigned_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_phone_numbers_status ON phone_numbers(status);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_agent_id ON phone_numbers(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_country ON phone_numbers(country);

-- Update trigger
CREATE OR REPLACE FUNCTION update_phone_numbers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_phone_numbers_updated_at
BEFORE UPDATE ON phone_numbers
FOR EACH ROW EXECUTE FUNCTION update_phone_numbers_updated_at();
