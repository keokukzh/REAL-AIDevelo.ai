import { getSupabaseAdmin } from '../db/supabase.js';

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
): Promise<{
  id: string;
  org_id: string;
  supabase_user_id: string;
  email: string | null;
  role: string;
}> {
  if (isDevBypass()) {
    return {
      id: '00000000-0000-0000-0000-000000000001',
      org_id: '00000000-0000-0000-0000-000000000002',
      supabase_user_id: authUserId,
      email: email || 'dev@example.com',
      role: 'admin', // Dev bypass defaults to admin for testing
    };
  }

  const client = getSupabaseAdmin();

  // Step 2: Ensure User exists
  // We use .limit(1) to handle potential duplicates from race conditions
  const { data: user, error: userError } = await client
    .from('users')
    .select('id, org_id, supabase_user_id, email')
    .eq('supabase_user_id', authUserId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (userError) throw new Error(`ensureUserRow: Error checking user: ${userError.message}`);

  if (user) return { ...user, role: 'user' };

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
        if (retryUser) return { ...retryUser, role: 'user' };
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
    if (retryUser) return { ...retryUser, role: 'user' };
    throw error;
  }

  // Create User
  const { data: newUser, error: createUserError } = await client
    .from('users')
    .insert({
      org_id: orgId,
      supabase_user_id: authUserId,
      email: email || null,
    })
    .select('id, org_id, supabase_user_id, email')
    .single();

  if (createUserError) {
    if (createUserError.code === '23505' || createUserError.message?.includes('duplicate')) {
      const { data: existingUser } = await client
        .from('users')
        .select('*')
        .eq('supabase_user_id', authUserId)
        .maybeSingle();
      if (existingUser) return { ...existingUser, role: 'user' };
    }
    throw new Error(`Failed to create user: ${createUserError.message}`);
  }

  if (!newUser) throw new Error('Failed to create user: No data');
  // Add role default to match signature until refactor
  return { ...newUser, role: 'user' };
}

/**
 * Ensure organization exists for user
 */
export async function ensureOrgForUser(
  authUserId: string,
  email?: string,
): Promise<{ id: string; name: string }> {
  if (isDevBypass())
    return { id: '00000000-0000-0000-0000-000000000002', name: 'Dev Organization' };

  const client = getSupabaseAdmin();

  // Get user first
  const { data: user } = await client
    .from('users')
    .select('org_id')
    .eq('supabase_user_id', authUserId)
    .order('created_at', { ascending: false })
    .limit(1)
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

  // Step 2: Check for existing organization
  const { data: org, error: orgError } = await client
    .from('organizations')
    .select('id, name')
    .eq('id', user.org_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (orgError) {
    throw new Error(`ensureOrgForUser: Error checking organization: ${orgError.message}`);
  }
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
      id: '00000000-0000-0000-0000-000000000003',
      name: locationName || 'Hauptstandort',
      timezone: 'Europe/Zurich',
      business_type: null,
    };
  }

  const client = getSupabaseAdmin();
  const name = locationName || 'Hauptstandort';

  // Step 1: Check for existing default location
  const { data: location, error: locationError } = await client
    .from('locations')
    .select('id, name, timezone, business_type')
    .eq('org_id', orgId)
    .eq('name', name)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (locationError) {
    throw new Error(`ensureDefaultLocation: Error checking location: ${locationError.message}`);
  }

  if (location) {
    // Ensure Qdrant collection exists (best effort)
    try {
      const { vectorStore } = await import('../voice-agent/rag/vectorStore.js'); // Dynamic import to avoid cycles
      await vectorStore.ensureCollection(location.id);
    } catch (e) {
      console.warn('Qdrant ensure failed', e);
    }
    return location;
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
    const { vectorStore } = await import('../voice-agent/rag/vectorStore.js');
    await vectorStore.ensureCollection(newLocation.id);
  } catch (e) {
    console.warn('Qdrant ensure failed', e);
  }

  return newLocation;
}

/**
 * Ensure agent config exists for location
 */
export async function ensureAgentConfig(locationId: string): Promise<Record<string, unknown>> {
  if (isDevBypass()) {
    return {
      id: '00000000-0000-0000-0000-000000000004',
      location_id: locationId,
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
    return existingConfig;
  }

  // Fetch location name for defaults
  const { data: loc } = await client
    .from('locations')
    .select('name')
    .eq('id', locationId)
    .maybeSingle();
  const companyName = loc?.name || 'Unser Unternehmen';

  const { data: newConfig, error } = await client
    .from('agent_configs')
    .insert({
      location_id: locationId,
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
