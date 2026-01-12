-- Rename google_calendar_integrations to generic calendar_connections
ALTER TABLE google_calendar_integrations RENAME TO calendar_connections;

-- Rename indexes
ALTER INDEX idx_google_calendar_integrations_location RENAME TO idx_calendar_connections_location;
ALTER INDEX idx_google_calendar_integrations_location_provider RENAME TO idx_calendar_connections_location_provider;

-- Update trigger
DROP TRIGGER IF EXISTS trg_google_calendar_integrations_updated ON calendar_connections;
-- Note: Trigger function set_updated_at is generic and can be reused

CREATE TRIGGER trg_calendar_connections_updated
  BEFORE UPDATE ON calendar_connections
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Add a comment to clarify the table purpose
COMMENT ON TABLE calendar_connections IS 'Stores OAuth tokens for calendar providers (google, outlook)';
