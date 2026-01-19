-- Migration: Add role to users table
-- Description: Adds a role column to distinguish between admins and regular users

DO $$
BEGIN
  -- Use ADD COLUMN IF NOT EXISTS for robustness
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

  -- Use EXECUTE to avoid parse-time errors if the column doesn't exist yet
  EXECUTE 'UPDATE public.users SET role = ''admin'' WHERE email = ''keokukmusic@gmail.com''';
END $$;
