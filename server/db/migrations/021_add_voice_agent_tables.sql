-- Migration: Add voice agent tables for self-hosted voice agent platform
-- Description: Adds agent_templates, voice_profiles, call_sessions tables
-- and extends agent_configs with voice_profile_id

-- Agent Templates (global, pre-configured by platform)
CREATE TABLE IF NOT EXISTS agent_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL, -- 'default-de-ch', 'restaurant-de-ch', etc.
  language TEXT NOT NULL DEFAULT 'de-CH',
  industry TEXT,
  system_prompt TEXT NOT NULL,
  default_config_json JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Voice Profiles (per tenant/location)
CREATE TABLE IF NOT EXISTS voice_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'parler', -- 'parler' | 'piper' | 'elevenlabs'
  preset TEXT NOT NULL, -- 'SwissProfessionalDE', 'FriendlyFemaleDE', etc.
  settings_json JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Extend agent_configs (add voice_profile_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agent_configs' AND column_name = 'voice_profile_id'
  ) THEN
    ALTER TABLE agent_configs ADD COLUMN voice_profile_id UUID REFERENCES voice_profiles(id);
  END IF;
END $$;

-- Call Sessions (extends call_logs with voice-specific data)
CREATE TABLE IF NOT EXISTS call_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agent_configs(id) ON DELETE SET NULL,
  call_sid TEXT UNIQUE NOT NULL, -- FreeSWITCH call UUID or Twilio CallSid
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound', 'test')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'initiating', 'ringing')),
  transcript_json JSONB DEFAULT '[]'::JSONB, -- Array of { role: 'user'|'assistant', text: string, timestamp: string }
  recording_url TEXT, -- MinIO URL or file path
  metadata_json JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Extend call_logs with recording_url and transcript_json if not exists
DO $$
BEGIN
  -- Add recording_url if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'call_logs' AND column_name = 'recording_url'
  ) THEN
    ALTER TABLE call_logs ADD COLUMN recording_url TEXT;
  END IF;

  -- Ensure transcript_json exists in notes_json (we'll use notes_json for backward compatibility)
  -- But also add a dedicated transcript_json column if needed
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'call_logs' AND column_name = 'transcript_json'
  ) THEN
    ALTER TABLE call_logs ADD COLUMN transcript_json JSONB DEFAULT '[]'::JSONB;
  END IF;
END $$;

-- Indexes for agent_templates
CREATE INDEX IF NOT EXISTS idx_agent_templates_slug ON agent_templates(slug);
CREATE INDEX IF NOT EXISTS idx_agent_templates_language ON agent_templates(language);
CREATE INDEX IF NOT EXISTS idx_agent_templates_industry ON agent_templates(industry) WHERE industry IS NOT NULL;

-- Indexes for voice_profiles
CREATE INDEX IF NOT EXISTS idx_voice_profiles_location ON voice_profiles(location_id);
CREATE INDEX IF NOT EXISTS idx_voice_profiles_provider ON voice_profiles(provider);

-- Indexes for call_sessions
CREATE INDEX IF NOT EXISTS idx_call_sessions_location ON call_sessions(location_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_call_sid ON call_sessions(call_sid);
CREATE INDEX IF NOT EXISTS idx_call_sessions_agent ON call_sessions(agent_id) WHERE agent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_call_sessions_status ON call_sessions(status);
CREATE INDEX IF NOT EXISTS idx_call_sessions_started_at ON call_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_sessions_location_started ON call_sessions(location_id, started_at DESC);

-- Index for agent_configs voice_profile_id
CREATE INDEX IF NOT EXISTS idx_agent_configs_voice_profile ON agent_configs(voice_profile_id) WHERE voice_profile_id IS NOT NULL;

-- Updated_at triggers
DROP TRIGGER IF EXISTS trg_agent_templates_updated ON agent_templates;
CREATE TRIGGER trg_agent_templates_updated
  BEFORE UPDATE ON agent_templates
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_voice_profiles_updated ON voice_profiles;
CREATE TRIGGER trg_voice_profiles_updated
  BEFORE UPDATE ON voice_profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_call_sessions_updated ON call_sessions;
CREATE TRIGGER trg_call_sessions_updated
  BEFORE UPDATE ON call_sessions
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Seed default agent templates
INSERT INTO agent_templates (slug, language, industry, system_prompt, default_config_json)
VALUES 
  (
    'default-de-ch',
    'de-CH',
    NULL,
    'Du bist ein hochprofessioneller KI Voice Agent von AIDevelo. Deine Mission:

🎯 HAUPTAUFGABEN:
- Begrüße jeden Anrufer freundlich und kompetent
- Qualifiziere Leads durch gezielte Fragen
- Beantworte Fragen präzise und hilfreich
- Vereinbare Termine mit dem Team
- Nimm wichtige Informationen auf

💡 KOMMUNIKATIONSSTIL:
- Klar, verständlich und professionell
- Schweizerische Höflichkeit mit Effizienz
- Immer lösungsorientiert
- Natürlich und menschlich

⚡ WICHTIG:
- Du bist 24/7 verfügbar
- Bei komplexen Fragen: Notiere Details für Rückruf
- Bleibe stets höflich, geduldig und zielführend
- Verwende Schweizer Hochdeutsch',
    '{"goals": ["Anrufe entgegennehmen", "Leads qualifizieren", "Termine vereinbaren"], "services": []}'::JSONB
  ),
  (
    'restaurant-de-ch',
    'de-CH',
    'restaurant',
    'Du bist der Voice Agent eines Restaurants. Du hilfst Gästen bei:
- Tischreservierungen
- Fragen zu Speisekarte und Öffnungszeiten
- Event-Anfragen
- Spezielle Wünsche (Allergien, vegetarisch, etc.)

Antworte freundlich und gastfreundlich. Bestätige Reservierungen mit Datum, Uhrzeit und Anzahl Personen.',
    '{"goals": ["Reservierungen entgegennehmen", "Fragen beantworten"], "services": ["Tischreservierung", "Event-Planung"]}'::JSONB
  ),
  (
    'service-de-ch',
    'de-CH',
    'service',
    'Du bist der Voice Agent eines Service-Unternehmens. Du hilfst Kunden bei:
- Terminvereinbarungen für Service-Besuche
- Fragen zu Leistungen und Preisen
- Notfälle priorisieren
- Rückruf-Anfragen

Antworte kompetent und lösungsorientiert. Bei Notfällen: Frage nach Dringlichkeit und Kontaktdaten.',
    '{"goals": ["Termine vereinbaren", "Leads qualifizieren", "Notfälle erkennen"], "services": []}'::JSONB
  )
ON CONFLICT (slug) DO NOTHING;

-- Comments
COMMENT ON TABLE agent_templates IS 'Pre-configured agent templates for different industries and languages';
COMMENT ON TABLE voice_profiles IS 'Voice profiles per location (TTS provider and preset configuration)';
COMMENT ON TABLE call_sessions IS 'Voice call sessions with transcripts and recordings';
COMMENT ON COLUMN call_sessions.transcript_json IS 'Array of conversation turns: [{role: "user"|"assistant", text: string, timestamp: ISO string}]';
COMMENT ON COLUMN call_sessions.recording_url IS 'URL to call recording in MinIO or file storage';

