-- Migration: Add role to users table
-- Description: Adds a role column to distinguish between admins and regular users

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'role'
  ) THEN
    ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user';
  END IF;

  -- Use EXECUTE to avoid parse-time errors if the column doesn't exist yet
  EXECUTE 'UPDATE users SET role = ''admin'' WHERE email = ''keokukmusic@gmail.com''';
END $$;
