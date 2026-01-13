-- Migration: Fix conversations table to support voice channel
-- Description: Updates the channel constraint to include 'voice' for test calls and voice sessions
-- Date: 2026-01-13

DO $$
BEGIN
  -- Drop the old constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'conversations' 
    AND constraint_name = 'conversations_channel_check'
  ) THEN
    ALTER TABLE conversations DROP CONSTRAINT conversations_channel_check;
  END IF;

  -- Add the new constraint with 'voice' included
  ALTER TABLE conversations 
    ADD CONSTRAINT conversations_channel_check 
    CHECK (channel IN ('webchat', 'whatsapp', 'voice'));

  -- Do the same for conversation_messages if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'conversation_messages' 
    AND constraint_name = 'conversation_messages_channel_check'
  ) THEN
    ALTER TABLE conversation_messages DROP CONSTRAINT conversation_messages_channel_check;
  END IF;

  ALTER TABLE conversation_messages 
    ADD CONSTRAINT conversation_messages_channel_check 
    CHECK (channel IN ('webchat', 'whatsapp', 'voice'));

  RAISE NOTICE 'Successfully updated channel constraints to include voice';
END $$;
