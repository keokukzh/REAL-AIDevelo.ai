-- Rename google_calendar_integrations to generic calendar_connections
-- Wrapped in DO block for idempotency
DO $$
BEGIN
    -- 1. Check if the OLD table exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'google_calendar_integrations') THEN
        ALTER TABLE google_calendar_integrations RENAME TO calendar_connections;
    END IF;
END $$;

-- 2. Rename indexes (IF EXISTS is supported in newer Postgres, but let's wrap to be safe/universal)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_google_calendar_integrations_location') THEN
        ALTER INDEX idx_google_calendar_integrations_location RENAME TO idx_calendar_connections_location;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_google_calendar_integrations_location_provider') THEN
        ALTER INDEX idx_google_calendar_integrations_location_provider RENAME TO idx_calendar_connections_location_provider;
    END IF;
END $$;

-- 3. Manage triggers on the NEW table name (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'calendar_connections') THEN
        -- Drop old trigger if it carried over or exists
        DROP TRIGGER IF EXISTS trg_google_calendar_integrations_updated ON calendar_connections;
        
        -- Create/Ensure new trigger
        DROP TRIGGER IF EXISTS trg_calendar_connections_updated ON calendar_connections;
        CREATE TRIGGER trg_calendar_connections_updated
          BEFORE UPDATE ON calendar_connections
          FOR EACH ROW
          EXECUTE FUNCTION set_updated_at();
          
        -- Add comment
        COMMENT ON TABLE calendar_connections IS 'Stores OAuth tokens for calendar providers (google, outlook)';
    END IF;
END $$;

