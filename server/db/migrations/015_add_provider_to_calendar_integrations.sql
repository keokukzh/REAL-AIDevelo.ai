-- Add provider column to google_calendar_integrations table
-- This allows support for multiple calendar providers (google, outlook, etc.)

-- Add provider column with default 'google' for existing rows
ALTER TABLE google_calendar_integrations
ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'google';

-- Drop the old unique constraint on location_id (if it exists as a unique constraint)
-- Note: The UNIQUE constraint in CREATE TABLE might be a constraint name, so we check first
DO $$
BEGIN
  -- Check if unique constraint exists on location_id alone
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
END $$;

-- Create unique index on (location_id, provider) to allow one integration per provider per location
CREATE UNIQUE INDEX IF NOT EXISTS idx_google_calendar_integrations_location_provider 
ON google_calendar_integrations(location_id, provider);

-- Add comment
COMMENT ON COLUMN google_calendar_integrations.provider IS 'Calendar provider: google, outlook, etc.';
