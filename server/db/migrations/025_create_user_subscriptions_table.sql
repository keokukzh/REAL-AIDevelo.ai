-- Migration: Create user_subscriptions table (Renamed/Revised from subscriptions)
-- Description: Stores Stripe subscription data for users

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  status TEXT NOT NULL, -- active, canceled, past_due, trialing
  plan_id TEXT, -- Price ID from Stripe
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for Performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);

-- RLS Policies
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Users can view own user_subscription' 
    AND polrelid = 'user_subscriptions'::regclass
  ) THEN
    CREATE POLICY "Users can view own user_subscription"
      ON user_subscriptions FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Updated_at trigger
DROP TRIGGER IF EXISTS trg_user_subscriptions_updated ON user_subscriptions;
CREATE TRIGGER trg_user_subscriptions_updated
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
