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
END $$;

-- Set admin role for the specified user
UPDATE users SET role = 'admin' WHERE email = 'keokukmusic@gmail.com';
