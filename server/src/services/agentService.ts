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
      .select(
        `
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
      `,
      )
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

  /**
   * Activate agent - set setup_state to 'ready'
   */
  static async activateAgent(agentConfigId: string) {
    const { data, error } = await supabaseAdmin
      .from('agent_configs')
      .update({
        setup_state: 'ready',
        updated_at: new Date().toISOString(),
      })
      .eq('id', agentConfigId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to activate agent: ${error.message}`);
    }

    return data;
  }

  /**
   * Deactivate agent - set setup_state to 'inactive'
   */
  static async deactivateAgent(agentConfigId: string) {
    const { data, error } = await supabaseAdmin
      .from('agent_configs')
      .update({
        setup_state: 'inactive',
        updated_at: new Date().toISOString(),
      })
      .eq('id', agentConfigId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to deactivate agent: ${error.message}`);
    }

    return data;
  }

  /**
   * Pause agent - set setup_state to 'paused' (keeps configuration)
   */
  static async pauseAgent(agentConfigId: string) {
    const { data, error } = await supabaseAdmin
      .from('agent_configs')
      .update({
        setup_state: 'paused',
        updated_at: new Date().toISOString(),
      })
      .eq('id', agentConfigId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to pause agent: ${error.message}`);
    }

    return data;
  }

  /**
   * Get quick status for dashboard (minimal payload)
   */
  static async getAgentQuickStatus(agentConfigId: string) {
    const { data, error } = await supabaseAdmin
      .from('agent_configs')
      .select('id, setup_state, updated_at')
      .eq('id', agentConfigId)
      .single();

    if (error) {
      throw new Error(`Failed to get agent status: ${error.message}`);
    }

    return {
      id: data.id,
      isActive: data.setup_state === 'ready',
      isPaused: data.setup_state === 'paused',
      setupState: data.setup_state,
      lastUpdated: data.updated_at,
    };
  }
}
