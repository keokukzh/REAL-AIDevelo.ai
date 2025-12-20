/**
 * Conversation Initiation Data Builder
 * 
 * Builds conversation_initiation_client_data consistently for phone + browser
 * This ensures parity between browser test and real phone calls
 */

import { supabaseAdmin } from '../../services/supabaseDb';

export interface ConversationInitContext {
  locationId: string;
  agentConfig: {
    id: string;
    eleven_agent_id: string | null;
    greeting_template: string | null;
    company_name: string | null;
    booking_required_fields_json: string[];
    booking_default_duration_min: number;
    services_json: any;
    goals_json: string[];
  };
  location: {
    name: string;
    timezone: string;
  };
  callContext?: {
    from?: string;
    to?: string;
    callSid?: string;
    testMode?: boolean;
  };
}

export interface ConversationInitiationClientData {
  dynamic_variables?: {
    company_name?: string;
    greeting?: string;
    required_fields?: string[];
    timezone?: string;
    service_catalog?: any;
    booking_duration_min?: number;
    [key: string]: any;
  };
  conversation_config_override?: {
    agent?: {
      first_message?: string;
      language?: string;
    };
  };
}

/**
 * Build conversation_initiation_client_data for ElevenLabs agent
 * 
 * This function ensures that both browser and phone calls use the same
 * dynamic variables and configuration, guaranteeing behavioral parity.
 */
export async function buildConversationInitData(
  context: ConversationInitContext
): Promise<ConversationInitiationClientData> {
  const {
    locationId,
    agentConfig,
    location,
    callContext = {},
  } = context;

  // Resolve company name (from agent config, location name, or default)
  const companyName = agentConfig.company_name || location.name || 'Unser Unternehmen';

  // Build greeting (use template if available, otherwise default)
  let greeting = agentConfig.greeting_template || `Grüezi, hier ist ${companyName}. Wie kann ich Ihnen helfen?`;
  
  // Replace {{company_name}} placeholder if present
  greeting = greeting.replace(/\{\{company_name\}\}/g, companyName);

  // Get required booking fields (default to standard set if not configured)
  const requiredFields = Array.isArray(agentConfig.booking_required_fields_json) && agentConfig.booking_required_fields_json.length > 0
    ? agentConfig.booking_required_fields_json
    : ['name', 'phone', 'service', 'preferredTime', 'timezone'];

  // Build dynamic variables
  const dynamicVariables: Record<string, any> = {
    company_name: companyName,
    greeting,
    required_fields: requiredFields,
    timezone: location.timezone,
    booking_duration_min: agentConfig.booking_default_duration_min || 30,
  };

  // Add service catalog if available
  if (agentConfig.services_json && typeof agentConfig.services_json === 'object') {
    dynamicVariables.service_catalog = agentConfig.services_json;
  }

  // Add goals if available (for agent context)
  if (Array.isArray(agentConfig.goals_json) && agentConfig.goals_json.length > 0) {
    dynamicVariables.agent_goals = agentConfig.goals_json;
  }

  // Add call context if available
  if (callContext.from) {
    dynamicVariables.caller_number = callContext.from;
  }
  if (callContext.callSid) {
    dynamicVariables.call_sid = callContext.callSid;
  }
  if (callContext.testMode) {
    dynamicVariables.test_mode = true;
  }

  // Build conversation config override (optional first message)
  // IMPORTANT: first_message triggers the agent to speak immediately
  const conversationConfigOverride: ConversationInitiationClientData['conversation_config_override'] = {
    agent: {
      first_message: greeting,
      language: 'de', // Default to German, can be made configurable later
    },
  };

  return {
    dynamic_variables: dynamicVariables,
    conversation_config_override: conversationConfigOverride,
  };
}

/**
 * Load full context for conversation initiation
 * Helper to fetch agent config and location data
 */
export async function loadConversationInitContext(
  locationId: string,
  callContext?: ConversationInitContext['callContext']
): Promise<ConversationInitContext> {
  // Load agent config
  const { data: agentConfigData, error: agentError } = await supabaseAdmin
    .from('agent_configs')
    .select('id, eleven_agent_id, greeting_template, company_name, booking_required_fields_json, booking_default_duration_min, services_json, goals_json')
    .eq('location_id', locationId)
    .maybeSingle();

  if (agentError || !agentConfigData) {
    throw new Error(`Agent config not found for locationId=${locationId}: ${agentError?.message || 'Not found'}`);
  }

  // Load location
  const { data: locationData, error: locationError } = await supabaseAdmin
    .from('locations')
    .select('name, timezone')
    .eq('id', locationId)
    .maybeSingle();

  if (locationError || !locationData) {
    throw new Error(`Location not found for locationId=${locationId}: ${locationError?.message || 'Not found'}`);
  }

  return {
    locationId,
    agentConfig: {
      id: agentConfigData.id,
      eleven_agent_id: agentConfigData.eleven_agent_id,
      greeting_template: agentConfigData.greeting_template,
      company_name: agentConfigData.company_name,
      booking_required_fields_json: Array.isArray(agentConfigData.booking_required_fields_json)
        ? agentConfigData.booking_required_fields_json
        : [],
      booking_default_duration_min: agentConfigData.booking_default_duration_min || 30,
      services_json: agentConfigData.services_json || {},
      goals_json: Array.isArray(agentConfigData.goals_json) ? agentConfigData.goals_json : [],
    },
    location: {
      name: locationData.name,
      timezone: locationData.timezone,
    },
    callContext,
  };
}
