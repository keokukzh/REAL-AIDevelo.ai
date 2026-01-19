-- Migration: Add updated_at to users table
-- Description: Fixes caching error where updated_at column was missing but referenced in code
-- Date: 2026-01-19

ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Start a transaction to reload the schema cache?
-- In Supabase/PostgREST, DDL usually triggers a reload. 
-- But just to be sure we can send a NOTIFY if we had a function for it.
-- For now, adding the column is the critical part.
