-- Ensure UUID generation is available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Switch users.id to UUID to align with application identifiers
ALTER TABLE users
ALTER COLUMN id DROP DEFAULT;

-- Cast existing ids to UUID; for small demo data we generate new UUIDs
ALTER TABLE users
ALTER COLUMN id TYPE uuid USING gen_random_uuid();

ALTER TABLE users
ALTER COLUMN id SET DEFAULT gen_random_uuid();
