-- Recreate calendar_connections table with extended schema
-- Adapting user request to use location_id instead of user_id to match system architecture

DROP TABLE IF EXISTS calendar_connections CASCADE;
DROP TABLE IF EXISTS google_calendar_integrations CASCADE;

CREATE TABLE calendar_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'outlook', 'microsoft')),
  connected_email TEXT,
  access_token TEXT,
  refresh_token_encrypted TEXT NOT NULL,
  expiry_ts TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(location_id, provider)
);

-- Indexes
CREATE INDEX idx_calendar_connections_location ON calendar_connections(location_id);
CREATE UNIQUE INDEX idx_calendar_connections_location_provider ON calendar_connections(location_id, provider);
CREATE INDEX idx_calendar_connections_is_active ON calendar_connections(is_active);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trg_calendar_connections_updated ON calendar_connections;
CREATE TRIGGER trg_calendar_connections_updated
  BEFORE UPDATE ON calendar_connections
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Comments
COMMENT ON TABLE calendar_connections IS 'Stores OAuth tokens for calendar providers (google, outlook)';
