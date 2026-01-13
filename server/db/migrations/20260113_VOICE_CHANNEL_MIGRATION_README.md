# Supabase Migration: Add Voice Channel Support

## Problem

The `conversations` table has a constraint that only allows `'webchat'` and `'whatsapp'` channels, but the voice agent test feature uses `'voice'` channel, causing this error:

```
Failed to create conversation: new row for relation "conversations"
violates check constraint "conversations_channel_check"
```

## Solution

Run the migration `20260113_add_voice_channel_support.sql` to add `'voice'` to the allowed channels.

## How to Apply

### Option 1: Supabase Dashboard (RECOMMENDED)

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Copy and paste the contents of `20260113_add_voice_channel_support.sql`
5. Click **Run**
6. You should see: "Successfully updated channel constraints to include voice"

### Option 2: psql CLI

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:[PORT]/postgres" \\
  -f server/db/migrations/20260113_add_voice_channel_support.sql
```

### Option 3: Supabase CLI

```bash
supabase db push
```

## Verification

After running the migration, test it:

```sql
-- This should now work without errors
INSERT INTO conversations (location_id, channel, external_user_id)
VALUES ('your-location-uuid', 'voice', 'test-user')
RETURNING *;
```

## Testing

1. Go to https://aidevelo.ai/dashboard
2. Click "Agent testen"
3. Select "Chat" tab
4. Send a test message
5. You should now get a response instead of an error

## Related Files

- `server/src/core/conversations/conversationRepository.ts` - TypeScript types for channels
- `server/db/migrations/019_create_multichannel_tables.sql` - Original table creation
