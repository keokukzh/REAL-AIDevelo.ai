import { supabaseAdmin } from './supabaseDb';
import { NotFoundError } from '../utils/errors';

/**
 * Agent Service - Supabase-based agent operations
 * Replaces legacy db.getAgent() calls
 */
export class AgentService {
  /**
   * Get agent config by location ID
   */
  static async getAgentConfigByLocationId(locationId: string) {
    const { data, error } = await supabaseAdmin
      .from('agent_configs')
      .select('*')
      .eq('location_id', locationId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch agent config: ${error.message}`);
    }

    return data;
  }

  /**
   * Get agent config by ID
   */
  static async getAgentConfigById(agentConfigId: string) {
    const { data, error } = await supabaseAdmin
      .from('agent_configs')
      .select('*')
      .eq('id', agentConfigId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch agent config: ${error.message}`);
    }

    if (!data) {
      throw new NotFoundError('Agent config');
    }

    return data;
  }

  /**
   * Get agent config with location and organization info
   */
  static async getAgentConfigWithLocation(agentConfigId: string) {
    const { data, error } = await supabaseAdmin
      .from('agent_configs')
      .select(`
        *,
        locations (
          id,
          name,
          timezone,
          org_id,
          organizations (
            id,
            name
          )
        )
      `)
      .eq('id', agentConfigId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch agent config: ${error.message}`);
    }

    if (!data) {
      throw new NotFoundError('Agent config');
    }

    return data;
  }

  /**
   * Verify agent exists (for test routes)
   * Returns agent config if found, throws NotFoundError if not
   */
  static async verifyAgentExists(agentConfigId: string) {
    const config = await this.getAgentConfigById(agentConfigId);
    return config;
  }
}
