-- Migration: Add calendar_events table for full calendar functionality
-- Description: Stores calendar events with Google Calendar sync support
-- Date: 2026-01-16

-- Calendar Events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  google_event_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  all_day BOOLEAN DEFAULT false,
  recurrence_rule TEXT,
  attendees JSONB DEFAULT '[]',
  reminders JSONB DEFAULT '[]',
  created_by TEXT NOT NULL DEFAULT 'user' CHECK (created_by IN ('user', 'agent')),
  linked_call_id UUID REFERENCES call_logs(id) ON DELETE SET NULL,
  google_synced BOOLEAN DEFAULT false,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  color TEXT DEFAULT '#3b82f6',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Calendar Sync Log table
CREATE TABLE IF NOT EXISTS calendar_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('manual', 'auto', 'agent')),
  events_synced INTEGER DEFAULT 0,
  conflicts INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]',
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Calendar Preferences
CREATE TABLE IF NOT EXISTS user_calendar_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  business_hours_start TIME DEFAULT '08:00',
  business_hours_end TIME DEFAULT '18:00',
  working_days INTEGER[] DEFAULT '{1,2,3,4,5}',
  default_event_duration INTEGER DEFAULT 30,
  default_reminder_minutes INTEGER DEFAULT 15,
  agent_can_read BOOLEAN DEFAULT true,
  agent_can_create BOOLEAN DEFAULT true,
  agent_can_update BOOLEAN DEFAULT true,
  agent_can_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_user ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_location ON calendar_events(location_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_end ON calendar_events(end_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_google ON calendar_events(google_event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by ON calendar_events(created_by);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_log_user ON calendar_sync_log(user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_calendar_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calendar_events_updated_at
BEFORE UPDATE ON calendar_events
FOR EACH ROW EXECUTE FUNCTION update_calendar_events_updated_at();

CREATE TRIGGER trg_user_calendar_preferences_updated_at
BEFORE UPDATE ON user_calendar_preferences
FOR EACH ROW EXECUTE FUNCTION update_calendar_events_updated_at();
