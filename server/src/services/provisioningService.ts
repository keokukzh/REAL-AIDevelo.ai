/**
 * Provisioning Service
 * Handles automatic provisioning of default agents for new tenants
 */

import { supabaseAdmin } from './supabaseDb';
import { logger, redact } from '../utils/logger';

export interface ProvisioningResult {
  locationId: string;
  agentId: string;
  voiceProfileId: string;
  agentConfigId: string;
  success: boolean;
  message?: string;
}

export class ProvisioningService {
  /**
   * Provision default agent for a location
   * Creates:
   * 1. Default voice profile
   * 2. Default agent from template
   * 3. Links agent_config to voice profile
   */
  async provisionDefaultAgent(locationId: string, templateSlug: string = 'default-de-ch'): Promise<ProvisioningResult> {
    try {
      logger.info('provisioning.start', redact({ locationId, templateSlug }));

      // Step 1: Get or create default voice profile
      let voiceProfileId: string;
      const { data: existingVoiceProfile } = await supabaseAdmin
        .from('voice_profiles')
        .select('id')
        .eq('location_id', locationId)
        .maybeSingle();

      if (existingVoiceProfile) {
        voiceProfileId = existingVoiceProfile.id;
        logger.info('provisioning.voice_profile_exists', redact({ locationId, voiceProfileId }));
      } else {
        const { data: newVoiceProfile, error: voiceProfileError } = await supabaseAdmin
          .from('voice_profiles')
          .insert({
            location_id: locationId,
            provider: 'parler',
            preset: 'SwissProfessionalDE',
            settings_json: {},
          })
          .select()
          .single();

        if (voiceProfileError) {
          throw new Error(`Failed to create voice profile: ${voiceProfileError.message}`);
        }

        voiceProfileId = newVoiceProfile.id;
        logger.info('provisioning.voice_profile_created', redact({ locationId, voiceProfileId }));
      }

      // Step 2: Get agent template
      const { data: template, error: templateError } = await supabaseAdmin
        .from('agent_templates')
        .select('*')
        .eq('slug', templateSlug)
        .maybeSingle();

      if (templateError || !template) {
        throw new Error(`Template ${templateSlug} not found`);
      }

      // Step 3: Check if agent_config already exists
      const { data: existingAgentConfig } = await supabaseAdmin
        .from('agent_configs')
        .select('id')
        .eq('location_id', locationId)
        .maybeSingle();

      let agentConfigId: string;
      if (existingAgentConfig) {
        agentConfigId = existingAgentConfig.id;

      // Update voice_profile_id if not set
      const existingConfig = existingAgentConfig as any;
      if (!existingConfig.voice_profile_id) {
        await supabaseAdmin
          .from('agent_configs')
          .update({ voice_profile_id: voiceProfileId })
          .eq('id', agentConfigId);
      }

        logger.info('provisioning.agent_config_exists', redact({ locationId, agentConfigId }));
      } else {
        // Create new agent_config from template
        const { data: location } = await supabaseAdmin
          .from('locations')
          .select('name')
          .eq('id', locationId)
          .single();

        const defaultConfig = template.default_config_json as any || {};

        const { data: newAgentConfig, error: agentConfigError } = await supabaseAdmin
          .from('agent_configs')
          .insert({
            location_id: locationId,
            voice_profile_id: voiceProfileId,
            setup_state: 'complete',
            business_type: template.industry || 'unknown',
            goals_json: defaultConfig.goals || [],
            services_json: defaultConfig.services || [],
            // Note: system_prompt is stored in agent_templates, not agent_configs
            // We can add a system_prompt field to agent_configs if needed
          })
          .select()
          .single();

        if (agentConfigError) {
          throw new Error(`Failed to create agent config: ${agentConfigError.message}`);
        }

        agentConfigId = newAgentConfig.id;
        logger.info('provisioning.agent_config_created', redact({ locationId, agentConfigId }));
      }

      logger.info('provisioning.complete', redact({ locationId, agentConfigId, voiceProfileId }));

      return {
        locationId,
        agentId: agentConfigId, // agent_configs.id is used as agent_id
        voiceProfileId,
        agentConfigId,
        success: true,
        message: 'Default agent provisioned successfully',
      };
    } catch (error: any) {
      logger.error('provisioning.failed', error, redact({ locationId }));
      return {
        locationId,
        agentId: '',
        voiceProfileId: '',
        agentConfigId: '',
        success: false,
        message: error.message || 'Provisioning failed',
      };
    }
  }

  /**
   * Check provisioning status for a location
   */
  async getProvisioningStatus(locationId: string): Promise<{
    isProvisioned: boolean;
    hasVoiceProfile: boolean;
    hasAgentConfig: boolean;
    voiceProfileId?: string;
    agentConfigId?: string;
  }> {
    const { data: voiceProfile } = await supabaseAdmin
      .from('voice_profiles')
      .select('id')
      .eq('location_id', locationId)
      .maybeSingle();

    const { data: agentConfig } = await supabaseAdmin
      .from('agent_configs')
      .select('id, voice_profile_id')
      .eq('location_id', locationId)
      .maybeSingle();

    return {
      isProvisioned: !!(voiceProfile && agentConfig),
      hasVoiceProfile: !!voiceProfile,
      hasAgentConfig: !!agentConfig,
      voiceProfileId: voiceProfile?.id,
      agentConfigId: agentConfig?.id,
    };
  }
}

export const provisioningService = new ProvisioningService();

