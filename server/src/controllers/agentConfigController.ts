import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/supabaseAuth';
import { supabaseAdmin, ensureOrgForUser, ensureDefaultLocation } from '../services/supabaseDb';
import { z } from 'zod';
import { InternalServerError } from '../utils/errors';

// Get backend version from environment
const getBackendVersion = (): string => {
  return process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || 'unknown';
};

// Request schema for updating agent config
const UpdateAgentConfigSchema = z.object({
  persona_gender: z.enum(['male', 'female']).optional(),
  persona_age_range: z.string().optional(),
  business_type: z.string().optional(),
  goals_json: z.array(z.string()).optional(),
  services_json: z.any().optional(),
  setup_state: z.enum(['needs_persona', 'needs_business', 'needs_phone', 'needs_calendar', 'ready']).optional(),
});

type UpdateAgentConfigRequest = z.infer<typeof UpdateAgentConfigSchema>;

// Response schema
const AgentConfigResponseSchema = z.object({
  id: z.string().uuid(),
  location_id: z.string().uuid(),
  eleven_agent_id: z.string().nullable(),
  setup_state: z.string(),
  persona_gender: z.string().nullable(),
  persona_age_range: z.string().nullable(),
  goals_json: z.array(z.string()),
  services_json: z.any(),
  business_type: z.string().nullable(),
});

/**
 * PATCH /api/agent/config
 * Updates agent config for the authenticated user's location
 */
export const updateAgentConfig = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const requestId = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    if (!req.supabaseUser) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        reason: 'User not authenticated',
        backendSha: getBackendVersion(),
        requestId,
      });
    }

    const { supabaseUserId, email } = req.supabaseUser;

    // Validate request body
    const validationResult = UpdateAgentConfigSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.errors,
        backendSha: getBackendVersion(),
        requestId,
      });
    }

    const updates = validationResult.data;

    // Get user's organization and location
    const org = await ensureOrgForUser(supabaseUserId, email);
    const location = await ensureDefaultLocation(org.id);

    // Find agent config for this location
    const { data: existingConfig, error: findError } = await supabaseAdmin
      .from('agent_configs')
      .select('*')
      .eq('location_id', location.id)
      .maybeSingle();

    if (findError && findError.code !== 'PGRST116') {
      throw new Error(`Failed to find agent config: ${findError.message || 'Unknown error'}`);
    }

    if (!existingConfig) {
      return res.status(404).json({
        success: false,
        error: 'Agent config not found',
        backendSha: getBackendVersion(),
        requestId,
      });
    }

    // Prepare update payload (only include fields that were provided)
    const updatePayload: any = {};
    if (updates.persona_gender !== undefined) updatePayload.persona_gender = updates.persona_gender;
    if (updates.persona_age_range !== undefined) updatePayload.persona_age_range = updates.persona_age_range;
    if (updates.business_type !== undefined) updatePayload.business_type = updates.business_type;
    if (updates.goals_json !== undefined) updatePayload.goals_json = updates.goals_json;
    if (updates.services_json !== undefined) updatePayload.services_json = updates.services_json;
    if (updates.setup_state !== undefined) updatePayload.setup_state = updates.setup_state;

    // Update agent config
    const { data: updatedConfig, error: updateError } = await supabaseAdmin
      .from('agent_configs')
      .update(updatePayload)
      .eq('id', existingConfig.id)
      .select('*')
      .single();

    if (updateError || !updatedConfig) {
      throw new Error(`Failed to update agent config: ${updateError?.message || 'Unknown error'}`);
    }

    // Validate response
    const validated = AgentConfigResponseSchema.parse({
      id: updatedConfig.id,
      location_id: updatedConfig.location_id,
      eleven_agent_id: updatedConfig.eleven_agent_id,
      setup_state: updatedConfig.setup_state,
      persona_gender: updatedConfig.persona_gender,
      persona_age_range: updatedConfig.persona_age_range,
      goals_json: Array.isArray(updatedConfig.goals_json) ? updatedConfig.goals_json : [],
      services_json: updatedConfig.services_json || [],
      business_type: updatedConfig.business_type,
    });

    res.setHeader('x-aidevelo-backend-sha', getBackendVersion());
    res.json({
      success: true,
      data: validated,
    });
  } catch (error) {
    console.error('[AgentConfigController] Error updating agent config:', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (error instanceof z.ZodError) {
      return res.status(500).json({
        success: false,
        error: 'Response validation failed',
        backendSha: getBackendVersion(),
        requestId,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to update agent config',
      backendSha: getBackendVersion(),
      requestId,
    });
  }
};

