-- Migration: Add business_type column to agent_configs table
-- Date: 2025-12-13
-- Issue: PostgREST schema cache was stale, causing "Could not find the 'business_type' column" errors
-- Fix: Column already exists in production, but schema.sql was missing it. This migration ensures consistency.

-- Add business_type column if it doesn't exist (idempotent)
-- Only run if agent_configs table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agent_configs') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'agent_configs' 
      AND column_name = 'business_type'
    ) THEN
      ALTER TABLE agent_configs 
      ADD COLUMN business_type TEXT NOT NULL DEFAULT 'unknown';
      
      -- Update existing rows to have a default value
      UPDATE agent_configs 
      SET business_type = 'unknown' 
      WHERE business_type IS NULL;
    END IF;
  END IF;
END $$;

-- Reload PostgREST schema cache (if running via Supabase SQL Editor, this is done automatically)
-- For manual execution: NOTIFY pgrst, 'reload schema';

