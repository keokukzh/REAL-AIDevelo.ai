-- Function to update agent configuration and location atomically
CREATE OR REPLACE FUNCTION update_agent_atomic(
  p_agent_id UUID,
  p_company_name TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_system_prompt TEXT DEFAULT NULL,
  p_greeting_template TEXT DEFAULT NULL,
  p_recording_consent BOOLEAN DEFAULT NULL,
  p_voice_id TEXT DEFAULT NULL,
  p_primary_locale TEXT DEFAULT NULL,
  p_admin_test_number TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  company_name TEXT,
  greeting_template TEXT,
  system_prompt TEXT,
  recording_consent BOOLEAN,
  setup_state TEXT,
  admin_test_number TEXT,
  location_id UUID,
  location_name TEXT
) 
LANGUAGE plpgsql
AS $$
DECLARE
  v_location_id UUID;
BEGIN
  -- Get location_id from agent_configs
  SELECT ac.location_id INTO v_location_id
  FROM agent_configs ac
  WHERE ac.id = p_agent_id;

  IF v_location_id IS NULL THEN
    RAISE EXCEPTION 'Agent not found: %', p_agent_id;
  END IF;

  -- Update agent_configs
  UPDATE agent_configs
  SET 
    company_name = COALESCE(p_company_name, company_name),
    greeting_template = COALESCE(p_greeting_template, greeting_template),
    system_prompt = COALESCE(p_system_prompt, system_prompt),
    recording_consent = COALESCE(p_recording_consent, recording_consent),
    eleven_agent_id = COALESCE(p_voice_id, eleven_agent_id),
    primary_locale = COALESCE(p_primary_locale, primary_locale),
    admin_test_number = COALESCE(p_admin_test_number, admin_test_number),
    updated_at = NOW()
  WHERE id = p_agent_id;

  -- Update location if city provided
  IF p_city IS NOT NULL THEN
    UPDATE locations
    SET name = p_city, updated_at = NOW()
    WHERE id = v_location_id;
  END IF;

  -- Return updated data with location
  RETURN QUERY
  SELECT 
    ac.id,
    ac.company_name,
    ac.greeting_template,
    ac.system_prompt,
    ac.recording_consent,
    ac.setup_state,
    ac.admin_test_number,
    ac.location_id,
    l.name as location_name
  FROM agent_configs ac
  LEFT JOIN locations l ON l.id = ac.location_id
  WHERE ac.id = p_agent_id;
END;
$$;
