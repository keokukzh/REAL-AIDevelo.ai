-- Migration: Add test user phone registration support
-- Description: Adds fields for test user status and phone verification
-- Date: 2026-01-16

-- Add status field to users if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_status TEXT DEFAULT 'inactive';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_test_user BOOLEAN DEFAULT false;

-- Create test_phone_numbers table for tracking test numbers
CREATE TABLE IF NOT EXISTS test_phone_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  call_forwarding_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create test_call_logs table for separate test call tracking
CREATE TABLE IF NOT EXISTS test_call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sid TEXT NOT NULL,
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  direction TEXT NOT NULL,
  status TEXT,
  duration_seconds INTEGER DEFAULT 0,
  agent_id UUID,
  transcript TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_test_phone_numbers_phone ON test_phone_numbers(phone_number);
CREATE INDEX IF NOT EXISTS idx_test_call_logs_from ON test_call_logs(from_number);
CREATE INDEX IF NOT EXISTS idx_test_call_logs_created ON test_call_logs(created_at);

-- Insert the test number
INSERT INTO test_phone_numbers (phone_number, status, call_forwarding_enabled)
VALUES ('+41764622999', 'active', true)
ON CONFLICT (phone_number) DO UPDATE SET status = 'active', updated_at = now();
