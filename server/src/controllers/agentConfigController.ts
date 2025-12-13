import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/supabaseAuth';
import { supabaseAdmin, ensureOrgForUser, ensureDefaultLocation, ensureAgentConfig } from '../services/supabaseDb';
import { z } from 'zod';
import { InternalServerError } from '../utils/errors';

// Get backend version from environment
const getBackendVersion = (): string => {
  return process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || 'unknown';
};

// Request schema for updating agent config (strict mode to reject unknown fields)
const UpdateAgentConfigSchema = z.object({
  persona_gender: z.enum(['male', 'female']).optional(),
  persona_age_range: z.string().optional(),
  business_type: z.string().optional(),
  goals_json: z.array(z.string()).optional(),
  services_json: z.any().optional(),
  setup_state: z.enum(['needs_persona', 'needs_business', 'needs_phone', 'needs_calendar', 'ready']).optional(),
}).strict();

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
): Promise<void> => {
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

    // Validate request body with strict mode
    const validationResult = UpdateAgentConfigSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        issues: validationResult.error.errors,
        backendSha: getBackendVersion(),
        requestId,
      });
    }

    const updates = validationResult.data;

    // Get user's organization and location
    const org = await ensureOrgForUser(supabaseUserId, email);
    const location = await ensureDefaultLocation(org.id);

    // Ensure agent config exists (idempotent)
    const agentConfig = await ensureAgentConfig(location.id);

    // Build update payload by filtering out undefined values
    const updatePayload = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    ) as any;

    // If no updates provided, return current config
    if (Object.keys(updatePayload).length === 0) {
      const validated = AgentConfigResponseSchema.parse({
        id: agentConfig.id,
        location_id: agentConfig.location_id,
        eleven_agent_id: agentConfig.eleven_agent_id,
        setup_state: agentConfig.setup_state,
        persona_gender: agentConfig.persona_gender,
        persona_age_range: agentConfig.persona_age_range,
        goals_json: Array.isArray(agentConfig.goals_json) ? agentConfig.goals_json : [],
        services_json: agentConfig.services_json || [],
        business_type: agentConfig.business_type,
      });

      res.setHeader('x-aidevelo-backend-sha', getBackendVersion());
      return res.json({
        success: true,
        data: validated,
      });
    }

    // Update agent config
    const { data: updatedConfig, error: updateError } = await supabaseAdmin
      .from('agent_configs')
      .update(updatePayload)
      .eq('id', agentConfig.id)
      .select('*')
      .single();

    if (updateError) {
      console.error('[AgentConfigController] Supabase update error:', {
        requestId,
        supabaseError: {
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
        },
      });

      return res.status(500).json({
        success: false,
        error: 'Failed to update agent config',
        step: 'updateAgentConfig',
        requestId,
        backendSha: getBackendVersion(),
        supabase: {
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
        },
      });
    }

    if (!updatedConfig) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update agent config',
        step: 'updateAgentConfig',
        reason: 'No data returned from update',
        requestId,
        backendSha: getBackendVersion(),
      });
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('[AgentConfigController] Error updating agent config:', {
      requestId,
      error: errorMessage,
      stack: errorStack,
    });

    if (error instanceof z.ZodError) {
      return res.status(500).json({
        success: false,
        error: 'Response validation failed',
        step: 'validateResponse',
        issues: error.errors,
        backendSha: getBackendVersion(),
        requestId,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to update agent config',
      step: 'updateAgentConfig',
      message: errorMessage,
      backendSha: getBackendVersion(),
      requestId,
    });
  }
};

