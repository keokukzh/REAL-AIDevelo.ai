import { supabaseAdmin, getSupabaseAdmin } from '../db/supabase';

// Helper: Check if we are in Dev Bypass mode
// (Ideally this should be handled by a mock repository implementation, but simpler to keep inline for now)
const isDevBypass = () => process.env.DEV_BYPASS_AUTH === 'true';

/**
 * Provisioning Repository
 * Handles creation/retrieval of core tenant entities (User, Org, Location, AgentConfig)
 * Includes race-condition handling for idempotent operations.
 */

/**
 * Ensure user row exists in users table
 * Idempotent: returns existing user if found, creates new if not
 */
export async function ensureUserRow(
  authUserId: string,
  email?: string,
  name?: string,
): Promise<{ id: string; org_id: string; supabase_user_id: string; email: string | null }> {
  if (isDevBypass()) {
    return {
      id: 'dev-user-id',
      org_id: 'dev-org-id',
      supabase_user_id: authUserId,
      email: email || 'dev@example.com',
    };
  }

  const client = getSupabaseAdmin();

  // Check if user exists
  const { data: existingUser, error: findError } = await client
    .from('users')
    .select('id, org_id, supabase_user_id, email')
    .eq('supabase_user_id', authUserId)
    .maybeSingle();

  if (existingUser && !findError) return existingUser;

  // Create Org if needed
  let orgId = '';
  try {
    const { data: newOrg, error: orgError } = await client
      .from('organizations')
      .insert({ name: name || 'Default Org' })
      .select('id')
      .single();

    if (orgError) {
      // Handle race condition: org duplicate?
      if (orgError.code === '23505' || orgError.message?.includes('duplicate')) {
        // Retry fetching user, maybe another request finished the flow
        const { data: retryUser } = await client
          .from('users')
          .select('*')
          .eq('supabase_user_id', authUserId)
          .maybeSingle();
        if (retryUser) return retryUser;
      }
      throw new Error(`Failed to create organization: ${orgError.message}`);
    }
    if (!newOrg) throw new Error('No org returned');
    orgId = newOrg.id;
  } catch (error) {
    // Last ditch check
    const { data: retryUser } = await client
      .from('users')
      .select('*')
      .eq('supabase_user_id', authUserId)
      .maybeSingle();
    if (retryUser) return retryUser;
    throw error;
  }

  // Create User
  const { data: newUser, error: userError } = await client
    .from('users')
    .insert({
      org_id: orgId,
      supabase_user_id: authUserId,
      email: email || null,
    })
    .select('id, org_id, supabase_user_id, email')
    .single();

  if (userError) {
    if (userError.code === '23505' || userError.message?.includes('duplicate')) {
      const { data: existingUser } = await client
        .from('users')
        .select('*')
        .eq('supabase_user_id', authUserId)
        .maybeSingle();
      if (existingUser) return existingUser;
    }
    throw new Error(`Failed to create user: ${userError.message}`);
  }

  if (!newUser) throw new Error('Failed to create user: No data');
  return newUser;
}

/**
 * Ensure organization exists for user
 */
export async function ensureOrgForUser(
  authUserId: string,
  email?: string,
): Promise<{ id: string; name: string }> {
  if (isDevBypass()) return { id: 'dev-org-id', name: 'Dev Organization' };

  const client = getSupabaseAdmin();

  // Get user first
  const { data: user } = await client
    .from('users')
    .select('org_id')
    .eq('supabase_user_id', authUserId)
    .maybeSingle();

  // If user missing, run full flow
  if (!user) {
    const newUser = await ensureUserRow(authUserId, email); // Handles recursion/race
    const { data: org } = await client
      .from('organizations')
      .select('id, name')
      .eq('id', newUser.org_id)
      .single();
    if (!org) throw new Error('Org not found after user creation');
    return org;
  }

  const { data: org } = await client
    .from('organizations')
    .select('id, name')
    .eq('id', user.org_id)
    .single();
  if (!org) throw new Error('Organization not found for existing user');
  return org;
}

/**
 * Ensure default location exists for organization
 */
export async function ensureDefaultLocation(
  orgId: string,
  locationName?: string,
): Promise<{ id: string; name: string; timezone: string; business_type: string | null }> {
  if (isDevBypass()) {
    return {
      id: 'dev-location-id',
      name: locationName || 'Hauptstandort',
      timezone: 'Europe/Zurich',
      business_type: null,
    };
  }

  const client = getSupabaseAdmin();
  const name = locationName || 'Hauptstandort';

  const { data: existingLocation } = await client
    .from('locations')
    .select('id, name, timezone, business_type')
    .eq('org_id', orgId)
    .eq('name', name)
    .limit(1)
    .maybeSingle();

  if (existingLocation) {
    // Ensure Qdrant collection exists (best effort)
    try {
      const { vectorStore } = await import('../voice-agent/rag/vectorStore'); // Dynamic import to avoid cycles
      await vectorStore.ensureCollection(existingLocation.id);
    } catch (e) {
      console.warn('Qdrant ensure failed', e);
    }
    return existingLocation;
  }

  const { data: newLocation, error } = await client
    .from('locations')
    .insert({
      org_id: orgId,
      name,
      timezone: 'Europe/Zurich',
      business_type: null,
    })
    .select('*')
    .single();

  if (error || !newLocation) throw new Error(`Failed to create location: ${error?.message}`);

  try {
    const { vectorStore } = await import('../voice-agent/rag/vectorStore');
    await vectorStore.ensureCollection(newLocation.id);
  } catch (e) {
    console.warn('Qdrant ensure failed', e);
  }

  return newLocation;
}

/**
 * Ensure agent config exists for location
 */
export async function ensureAgentConfig(locationId: string): Promise<any> {
  if (isDevBypass()) {
    return {
      id: 'dev-config-id',
      location_id: locationId,
      eleven_agent_id: process.env.ELEVENLABS_AGENT_ID_DEFAULT || 'agent_mock',
      setup_state: 'ready',
      persona_gender: 'female',
      persona_age_range: '25-35',
      goals_json: ['Termine vereinbaren'],
      services_json: [],
      business_type: 'general',
      greeting_template: 'Gruezi! Dies ist ein Dev-Agent.',
      company_name: 'Dev Company',
      booking_required_fields_json: ['name', 'phone'],
      booking_default_duration_min: 30,
    };
  }

  const client = getSupabaseAdmin();

  const { data: existingConfig } = await client
    .from('agent_configs')
    .select('*')
    .eq('location_id', locationId)
    .maybeSingle();

  if (existingConfig) {
    if (!existingConfig.eleven_agent_id) {
      // Patch missing ID
      const defId = process.env.ELEVENLABS_AGENT_ID_DEFAULT || 'agent_1601kcmqt4efe41bzwykaytm2yrj';
      const { data: updated } = await client
        .from('agent_configs')
        .update({ eleven_agent_id: defId })
        .eq('id', existingConfig.id)
        .select()
        .single();
      if (updated) return updated;
    }
    return existingConfig;
  }

  // Fetch location name for defaults
  const { data: loc } = await client
    .from('locations')
    .select('name')
    .eq('id', locationId)
    .maybeSingle();
  const companyName = loc?.name || 'Unser Unternehmen';
  const defId = process.env.ELEVENLABS_AGENT_ID_DEFAULT || 'agent_1601kcmqt4efe41bzwykaytm2yrj';

  const { data: newConfig, error } = await client
    .from('agent_configs')
    .insert({
      location_id: locationId,
      eleven_agent_id: defId,
      setup_state: 'needs_persona',
      persona_gender: 'female',
      persona_age_range: '25-35',
      goals_json: [],
      services_json: [],
      business_type: 'general',
      greeting_template: `Grüezi, hier ist ${companyName}. Wie kann ich Ihnen helfen?`,
      company_name: companyName,
      booking_required_fields_json: ['name', 'phone', 'service', 'preferredTime', 'timezone'],
      booking_default_duration_min: 30,
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      const { data: raceConfig } = await client
        .from('agent_configs')
        .select('*')
        .eq('location_id', locationId)
        .maybeSingle();
      if (raceConfig) return raceConfig;
    }
    throw new Error(`Failed to create agent config: ${error.message}`);
  }
  return newConfig;
}
