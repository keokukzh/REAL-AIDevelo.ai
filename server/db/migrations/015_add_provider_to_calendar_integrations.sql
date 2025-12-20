-- Add provider column to google_calendar_integrations table
-- This allows support for multiple calendar providers (google, outlook, etc.)

-- Only run if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'google_calendar_integrations') THEN
    -- Add provider column with default 'google' for existing rows
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'google_calendar_integrations' AND column_name = 'provider') THEN
      ALTER TABLE google_calendar_integrations
      ADD COLUMN provider TEXT NOT NULL DEFAULT 'google';
    END IF;

    -- Drop the old unique constraint on location_id (if it exists as a unique constraint)
    IF EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conrelid = 'google_calendar_integrations'::regclass 
      AND contype = 'u' 
      AND array_length(conkey, 1) = 1
      AND conkey[1] = (SELECT attnum FROM pg_attribute WHERE attrelid = 'google_calendar_integrations'::regclass AND attname = 'location_id')
    ) THEN
      -- Drop the old unique constraint
      ALTER TABLE google_calendar_integrations DROP CONSTRAINT google_calendar_integrations_location_id_key;
    END IF;

    -- Create unique index on (location_id, provider) to allow one integration per provider per location
    CREATE UNIQUE INDEX IF NOT EXISTS idx_google_calendar_integrations_location_provider 
    ON google_calendar_integrations(location_id, provider);

    -- Add comment
    COMMENT ON COLUMN google_calendar_integrations.provider IS 'Calendar provider: google, outlook, etc.';
  END IF;
END $$;
