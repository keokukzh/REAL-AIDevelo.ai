import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env';

const supabaseUrl = config.supabaseUrl;
const supabaseServiceRoleKey = config.supabaseServiceRoleKey;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
}

// Service Role Client (server-only, bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Ensure user row exists in users table
 * Idempotent: returns existing user if found, creates new if not
 */
export async function ensureUserRow(
  authUserId: string,
  email?: string,
  name?: string
): Promise<{ id: string; org_id: string; supabase_user_id: string; email: string | null }> {
  // Check if user exists
  const { data: existingUser, error: findError } = await supabaseAdmin
    .from('users')
    .select('id, org_id, supabase_user_id, email')
    .eq('supabase_user_id', authUserId)
    .maybeSingle();

  if (existingUser && !findError) {
    return existingUser;
  }

  // User doesn't exist - create org first, then user
  // Handle race condition: if org/user creation fails due to unique constraint, retry fetching
  let org;
  try {
    const { data: newOrg, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert({ name: name || 'Default Org' })
      .select('id')
      .single();

    if (orgError) {
      // Check if it's a unique constraint violation (race condition - another request created org)
      // In this case, we should retry fetching the user
      if (orgError.code === '23505' || orgError.message?.includes('duplicate') || orgError.message?.includes('unique')) {
        // Race condition: another request created the org, retry fetching user
        const { data: retryUser, error: retryError } = await supabaseAdmin
          .from('users')
          .select('id, org_id, supabase_user_id, email')
          .eq('supabase_user_id', authUserId)
          .maybeSingle();
        
        if (retryUser && !retryError) {
          return retryUser;
        }
      }
      throw new Error(`Failed to create organization: ${orgError.message || 'Unknown error'}`);
    }

    if (!newOrg) {
      throw new Error('Failed to create organization: No data returned');
    }

    org = newOrg;
  } catch (error) {
    // If org creation failed and it's not a race condition, throw
    if (error instanceof Error && !error.message.includes('retry')) {
      throw error;
    }
    // Otherwise, retry fetching user (race condition handled above)
    const { data: retryUser, error: retryError } = await supabaseAdmin
      .from('users')
      .select('id, org_id, supabase_user_id, email')
      .eq('supabase_user_id', authUserId)
      .maybeSingle();
    
    if (retryUser && !retryError) {
      return retryUser;
    }
    throw error;
  }

  // Create user linked to org
  const { data: newUser, error: userError } = await supabaseAdmin
    .from('users')
    .insert({
      org_id: org.id,
      supabase_user_id: authUserId,
      email: email || null,
    })
    .select('id, org_id, supabase_user_id, email')
    .single();

  if (userError) {
    // Check if it's a unique constraint violation (race condition - another request created user)
    if (userError.code === '23505' || userError.message?.includes('duplicate') || userError.message?.includes('unique')) {
      // Race condition: another request created the user, fetch it
      const { data: existingUser, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('id, org_id, supabase_user_id, email')
        .eq('supabase_user_id', authUserId)
        .maybeSingle();
      
      if (existingUser && !fetchError) {
        return existingUser;
      }
    }
    throw new Error(`Failed to create user: ${userError.message || 'Unknown error'}`);
  }

  if (!newUser) {
    throw new Error('Failed to create user: No data returned');
  }

  return newUser;
}

/**
 * Ensure organization exists for user
 * Idempotent: returns user's org if exists, creates new if not
 * Handles race conditions: if user doesn't exist, create user+org via ensureUserRow
 */
export async function ensureOrgForUser(
  authUserId: string,
  email?: string
): Promise<{ id: string; name: string }> {
  // Get user first
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('org_id')
    .eq('supabase_user_id', authUserId)
    .maybeSingle();

  // If user doesn't exist, create user+org via ensureUserRow (handles race conditions)
  if (userError || !user) {
    // This might be a race condition - try to create user+org
    const newUser = await ensureUserRow(authUserId, email);
    // Now get the org
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, name')
      .eq('id', newUser.org_id)
      .maybeSingle();

    if (orgError || !org) {
      throw new Error(`Organization not found after user creation: ${orgError?.message || 'Unknown error'}`);
    }

    return org;
  }

  // Get org
  const { data: org, error: orgError } = await supabaseAdmin
    .from('organizations')
    .select('id, name')
    .eq('id', user.org_id)
    .maybeSingle();

  if (orgError || !org) {
    throw new Error(`Organization not found: ${orgError?.message || 'Unknown error'}`);
  }

  return org;
}

/**
 * Ensure default location exists for organization
 * Idempotent: returns existing location if found, creates new if not
 */
export async function ensureDefaultLocation(
  orgId: string,
  locationName?: string
): Promise<{ id: string; name: string; timezone: string; business_type: string | null }> {
  // Check if default location exists
  const { data: existingLocation, error: findError } = await supabaseAdmin
    .from('locations')
    .select('id, name, timezone, business_type')
    .eq('org_id', orgId)
    .eq('name', locationName || 'Hauptstandort')
    .limit(1)
    .maybeSingle();

  if (existingLocation && !findError) {
    // Ensure Qdrant collection exists for existing location (idempotent)
    try {
      const { vectorStore } = await import('../voice-agent/rag/vectorStore');
      await vectorStore.ensureCollection(existingLocation.id);
    } catch (error) {
      // Log warning but don't fail if Qdrant is unavailable
      console.warn(`[SupabaseDb] Failed to ensure Qdrant collection for existing locationId=${existingLocation.id}:`, error);
    }
    return existingLocation;
  }

  // Location doesn't exist - create it
  const { data: newLocation, error: createError } = await supabaseAdmin
    .from('locations')
    .insert({
      org_id: orgId,
      name: locationName || 'Hauptstandort',
      timezone: 'Europe/Zurich',
      business_type: null,
    })
    .select('id, name, timezone, business_type')
    .single();

  if (createError || !newLocation) {
    throw new Error(`Failed to create location: ${createError?.message || 'Unknown error'}`);
  }

  // Ensure Qdrant collection exists for this location
  try {
    const { vectorStore } = await import('../voice-agent/rag/vectorStore');
    await vectorStore.ensureCollection(newLocation.id);
    console.log(`[SupabaseDb] Ensured Qdrant collection for locationId=${newLocation.id}`);
  } catch (error) {
    // Log warning but don't fail location creation if Qdrant is unavailable
    console.warn(`[SupabaseDb] Failed to ensure Qdrant collection for locationId=${newLocation.id}:`, error);
  }

  return newLocation;
}

/**
 * Ensure agent config exists for location
 * Idempotent: returns existing config if found, creates new if not
 */
export async function ensureAgentConfig(
  locationId: string
): Promise<{
  id: string;
  location_id: string;
  eleven_agent_id: string | null;
  setup_state: string;
  persona_gender: string | null;
  persona_age_range: string | null;
  goals_json: any;
  services_json: any;
  business_type: string | null;
}> {
  // Check if agent config exists (use maybeSingle to avoid error if not found)
  const { data: existingConfig, error: findError } = await supabaseAdmin
    .from('agent_configs')
    .select('*')
    .eq('location_id', locationId)
    .maybeSingle();

  // If config exists and no error, check if it needs default Agent ID
  if (existingConfig && !findError) {
    // Auto-update if eleven_agent_id is missing
    if (!existingConfig.eleven_agent_id) {
      const defaultElevenAgentId = process.env.ELEVENLABS_AGENT_ID_DEFAULT || 'agent_1601kcmqt4efe41bzwykaytm2yrj';
      const { data: updatedConfig, error: updateError } = await supabaseAdmin
        .from('agent_configs')
        .update({ eleven_agent_id: defaultElevenAgentId })
        .eq('id', existingConfig.id)
        .select('*')
        .single();
      
      if (!updateError && updatedConfig) {
        console.log(`[ensureAgentConfig] Auto-set default Agent ID for locationId=${locationId}`);
        return updatedConfig;
      }
    }
    return existingConfig;
  }

  // If there was an error that's NOT "not found", throw it
  if (findError && findError.code !== 'PGRST116') {
    throw new Error(`Failed to check agent config: ${findError.message || 'Unknown error'}`);
  }

  // Agent config doesn't exist - create it
  // Default Agent ID for immediate testing: agent_1601kcmqt4efe41bzwykaytm2yrj
  const defaultElevenAgentId = process.env.ELEVENLABS_AGENT_ID_DEFAULT || 'agent_1601kcmqt4efe41bzwykaytm2yrj';

  const { data: newConfig, error: createError } = await supabaseAdmin
    .from('agent_configs')
    .insert({
      location_id: locationId,
      eleven_agent_id: defaultElevenAgentId,
      setup_state: 'needs_persona',
      persona_gender: 'female',
      persona_age_range: '25-35',
      goals_json: [],
      services_json: [],
      business_type: 'general',
    })
    .select('*')
    .single();

  if (createError) {
    // Check if it's a unique constraint violation (race condition)
    if (createError.code === '23505' || createError.message?.includes('duplicate') || createError.message?.includes('unique')) {
      // Race condition: another request created the config, fetch it
      const { data: existingConfigAfterRace, error: fetchError } = await supabaseAdmin
        .from('agent_configs')
        .select('*')
        .eq('location_id', locationId)
        .maybeSingle();
      
      if (existingConfigAfterRace && !fetchError) {
        return existingConfigAfterRace;
      }
    }
    throw new Error(`Failed to create agent config: ${createError.message || 'Unknown error'}`);
  }

  if (!newConfig) {
    throw new Error('Failed to create agent config: No data returned');
  }

  return newConfig;
}

