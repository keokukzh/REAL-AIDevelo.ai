-- Add phone columns to channels_config table
ALTER TABLE channels_config 
ADD COLUMN IF NOT EXISTS phone_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);

-- Update existing rows
UPDATE channels_config 
SET phone_enabled = false 
WHERE phone_enabled IS NULL;
