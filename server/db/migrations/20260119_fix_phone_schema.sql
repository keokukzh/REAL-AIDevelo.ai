-- Fix/Ensure Phone Schema Migration
-- Combines previous migrations to ensure all columns exist, preventing 500 errors

-- 1. Ensure columns in 'users' table
ALTER TABLE users ADD COLUMN IF NOT EXISTS personal_phone_number TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS call_forwarding_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_call_test TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_status TEXT DEFAULT 'inactive';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_test_user BOOLEAN DEFAULT false;

-- 2. Ensure columns in 'phone_numbers' table
ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS is_purchased BOOLEAN DEFAULT false;
ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS monthly_fee NUMERIC(10, 2) DEFAULT 0.00;

-- 3. Ensure columns in 'channels_config' table
ALTER TABLE channels_config ADD COLUMN IF NOT EXISTS phone_enabled BOOLEAN DEFAULT false;
ALTER TABLE channels_config ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);

-- 4. Create indexes if not exist
CREATE INDEX IF NOT EXISTS idx_users_personal_phone ON users(personal_phone_number);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_owner ON phone_numbers(owner_user_id);

-- 5. Create test tables if not exist
CREATE TABLE IF NOT EXISTS test_phone_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  call_forwarding_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

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

-- Indexes for test tables
CREATE INDEX IF NOT EXISTS idx_test_phone_numbers_phone ON test_phone_numbers(phone_number);
CREATE INDEX IF NOT EXISTS idx_test_call_logs_from ON test_call_logs(from_number);
CREATE INDEX IF NOT EXISTS idx_test_call_logs_created ON test_call_logs(created_at);

-- 6. Insert default test number if missing
INSERT INTO test_phone_numbers (phone_number, status, call_forwarding_enabled)
VALUES ('+41764622999', 'active', true)
ON CONFLICT (phone_number) DO UPDATE SET status = 'active', updated_at = now();
