-- Migration: Add phone management fields to users and phone_numbers
-- Description: Supports personal phone forwarding and purchasing virtual numbers
-- Date: 2026-01-16

-- 1. Add fields to users table for personal phone support
ALTER TABLE users ADD COLUMN IF NOT EXISTS personal_phone_number TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS call_forwarding_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_call_test TIMESTAMP WITH TIME ZONE;

-- 2. Add fields to phone_numbers table for purchased numbers
ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS is_purchased BOOLEAN DEFAULT false;
ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS monthly_fee NUMERIC(10, 2) DEFAULT 0.00;

-- 3. Index for performance
CREATE INDEX IF NOT EXISTS idx_users_personal_phone ON users(personal_phone_number);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_owner ON phone_numbers(owner_user_id);
