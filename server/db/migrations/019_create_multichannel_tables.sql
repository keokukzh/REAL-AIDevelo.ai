-- Migration: Create multichannel tables for Webchat + WhatsApp
-- Description: Adds channels_config, webchat_widget_keys, conversations, and conversation_messages tables
-- for unified agent core across voice, webchat, and WhatsApp channels

-- Only create if locations table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'locations') THEN
    -- Channels Configuration (one per location)
    CREATE TABLE IF NOT EXISTS channels_config (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      location_id UUID NOT NULL UNIQUE REFERENCES locations(id) ON DELETE CASCADE,
      whatsapp_to TEXT,
      whatsapp_enabled BOOLEAN NOT NULL DEFAULT true,
      webchat_enabled BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Unique constraint on whatsapp_to (when not null)
    CREATE UNIQUE INDEX IF NOT EXISTS idx_channels_config_whatsapp_to ON channels_config(whatsapp_to) WHERE whatsapp_to IS NOT NULL;

    -- Index for location lookups
    CREATE INDEX IF NOT EXISTS idx_channels_config_location ON channels_config(location_id);

    -- Webchat Widget Keys (public keys for widget authentication)
    CREATE TABLE IF NOT EXISTS webchat_widget_keys (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
      public_key TEXT NOT NULL UNIQUE,
      allowed_domains TEXT[] NOT NULL DEFAULT '{}',
      enabled BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Indexes for widget keys
    CREATE INDEX IF NOT EXISTS idx_webchat_widget_keys_location ON webchat_widget_keys(location_id);
    CREATE INDEX IF NOT EXISTS idx_webchat_widget_keys_public_key ON webchat_widget_keys(public_key);
    CREATE INDEX IF NOT EXISTS idx_webchat_widget_keys_enabled ON webchat_widget_keys(enabled) WHERE enabled = true;

    -- Conversations (one per external user per channel per location)
    CREATE TABLE IF NOT EXISTS conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
      channel TEXT NOT NULL CHECK (channel IN ('webchat', 'whatsapp')),
      external_user_id TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Unique constraint: one conversation per location/channel/external_user combination
    CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_unique ON conversations(location_id, channel, external_user_id);

    -- Indexes for conversations
    CREATE INDEX IF NOT EXISTS idx_conversations_location ON conversations(location_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_location_last_message ON conversations(location_id, last_message_at DESC);
    CREATE INDEX IF NOT EXISTS idx_conversations_channel ON conversations(channel);

    -- Conversation Messages (all messages in conversations)
    CREATE TABLE IF NOT EXISTS conversation_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
      channel TEXT NOT NULL CHECK (channel IN ('webchat', 'whatsapp')),
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
      text TEXT NOT NULL,
      external_message_id TEXT,
      raw_json JSONB DEFAULT '{}'::JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Unique constraint for idempotency: external_message_id per channel (e.g., Twilio MessageSid)
    CREATE UNIQUE INDEX IF NOT EXISTS idx_conversation_messages_external_id ON conversation_messages(channel, external_message_id) WHERE external_message_id IS NOT NULL;

    -- Indexes for messages
    CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation ON conversation_messages(conversation_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_conversation_messages_location ON conversation_messages(location_id);
    CREATE INDEX IF NOT EXISTS idx_conversation_messages_channel ON conversation_messages(channel);
    CREATE INDEX IF NOT EXISTS idx_conversation_messages_created_at ON conversation_messages(created_at DESC);

    -- Updated_at triggers (using existing set_updated_at function from schema.sql)
    DROP TRIGGER IF EXISTS trg_channels_config_updated ON channels_config;
    CREATE TRIGGER trg_channels_config_updated
      BEFORE UPDATE ON channels_config
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();

    DROP TRIGGER IF EXISTS trg_webchat_widget_keys_updated ON webchat_widget_keys;
    CREATE TRIGGER trg_webchat_widget_keys_updated
      BEFORE UPDATE ON webchat_widget_keys
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;
