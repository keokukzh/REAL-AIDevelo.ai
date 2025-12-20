import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/supabaseAuth';
import { supabaseAdmin, ensureOrgForUser, ensureDefaultLocation, ensureAgentConfig } from '../services/supabaseDb';
import { z } from 'zod';
import { InternalServerError } from '../utils/errors';

// Get backend version from environment
const getBackendVersion = (): string => {
  return process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || 'unknown';
};

// Request schema for updating agent config (strict mode retained; we'll whitelist keys before validating)
const UpdateAgentConfigSchema = z.object({
  persona_gender: z.enum(['male', 'female']).optional(),
  persona_age_range: z.string().optional(),
  business_type: z.string().optional(),
  goals_json: z.array(z.string()).optional(),
  services_json: z.any().optional(),
  setup_state: z.enum(['needs_persona', 'needs_business', 'needs_phone', 'needs_calendar', 'ready']).optional(),
  eleven_agent_id: z.string().optional().nullable(),
  admin_test_number: z.string().optional().nullable(),
  greeting_template: z.string().optional().nullable(),
  company_name: z.string().optional().nullable(),
  booking_required_fields_json: z.array(z.string()).optional(),
  booking_default_duration_min: z.number().int().min(5).max(480).optional(),
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
  admin_test_number: z.string().nullable().optional(),
  greeting_template: z.string().nullable().optional(),
  company_name: z.string().nullable().optional(),
  booking_required_fields_json: z.array(z.string()).optional(),
  booking_default_duration_min: z.number().optional(),
  updated_at: z.string().optional(),
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

    // Build payload from a strict whitelist before validation
    const allowedKeys = [
      'setup_state',
      'persona_gender',
      'persona_age_range',
      'business_type',
      'goals_json',
      'services_json',
      'eleven_agent_id',
      'admin_test_number',
      'greeting_template',
      'company_name',
      'booking_required_fields_json',
      'booking_default_duration_min',
    ] as const;
    const rawBody = (req.body ?? {}) as Record<string, unknown>;
    const whitelistedBody: Record<string, unknown> = {};
    for (const key of allowedKeys) {
      if (key in rawBody) {
        const value = (rawBody as any)[key];
        if (value !== undefined) whitelistedBody[key] = value;
      }
    }

    // Validate request body with strict mode on the whitelisted payload
    const validationResult = UpdateAgentConfigSchema.safeParse(whitelistedBody);
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

    // If payload is effectively empty after whitelist, reject
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update',
        backendSha: getBackendVersion(),
        requestId,
      });
    }

    // Get user's organization and location
    const org = await ensureOrgForUser(supabaseUserId, email);
    const location = await ensureDefaultLocation(org.id);

    // Ensure agent config exists (idempotent)
    const agentConfig = await ensureAgentConfig(location.id);

    // Build update payload by filtering out undefined values, normalize arrays
    const updatePayload = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    ) as any;
    if ('goals_json' in updatePayload) {
      const gj = updatePayload.goals_json;
      if (!Array.isArray(gj)) updatePayload.goals_json = [];
      else updatePayload.goals_json = gj.filter((x: any) => typeof x === 'string');
    }
    if ('services_json' in updatePayload && updatePayload.services_json == null) {
      updatePayload.services_json = [];
    }

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
      .select('id, location_id, setup_state, persona_gender, persona_age_range, goals_json, services_json, business_type, eleven_agent_id, admin_test_number, greeting_template, company_name, booking_required_fields_json, booking_default_duration_min, updated_at')
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

      // Create error object with Supabase details for error handler
      const errorWithSupabase = new Error('Failed to update agent config');
      (errorWithSupabase as any).supabase = {
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
      };
      (errorWithSupabase as any).step = 'updateAgentConfig';
      
      // Throw to be caught by outer catch, which will use error handler
      throw errorWithSupabase;
    }

    if (!updatedConfig) {
      const error = new Error('Failed to update agent config: No data returned from update');
      (error as any).step = 'updateAgentConfig';
      throw error;
    }

    // Validate response (defensive: never 500 due to Zod in prod)
    const normalizedForResponse = {
      id: updatedConfig.id,
      location_id: updatedConfig.location_id,
      eleven_agent_id: updatedConfig.eleven_agent_id,
      setup_state: String(updatedConfig.setup_state),
      persona_gender: updatedConfig.persona_gender,
      persona_age_range: updatedConfig.persona_age_range,
      goals_json: Array.isArray(updatedConfig.goals_json)
        ? updatedConfig.goals_json.filter((x: any) => typeof x === 'string')
        : [],
      services_json: updatedConfig.services_json || [],
      business_type: updatedConfig.business_type,
      admin_test_number: (updatedConfig as any).admin_test_number ?? null,
      greeting_template: (updatedConfig as any).greeting_template ?? null,
      company_name: (updatedConfig as any).company_name ?? null,
      booking_required_fields_json: Array.isArray((updatedConfig as any).booking_required_fields_json)
        ? (updatedConfig as any).booking_required_fields_json.filter((x: any) => typeof x === 'string')
        : [],
      booking_default_duration_min: (updatedConfig as any).booking_default_duration_min ?? 30,
      updated_at: (updatedConfig as any).updated_at,
    };
    const validatedResult = AgentConfigResponseSchema.safeParse(normalizedForResponse);
    if (!validatedResult.success) {
      console.error('[AgentConfigController] Response validation failed', {
        requestId,
        issues: validatedResult.error.errors,
      });
      // In production: return minimal success payload to avoid blocking Wizard
      res.setHeader('x-aidevelo-backend-sha', getBackendVersion());
      res.setHeader('x-aidevelo-request-id', requestId);
      return res.json({
        success: true,
        data: { setup_state: normalizedForResponse.setup_state },
        requestId,
      });
    }

    res.setHeader('x-aidevelo-backend-sha', getBackendVersion());
    res.setHeader('x-aidevelo-request-id', requestId);
    return res.json({
      success: true,
      data: validatedResult.data,
      requestId,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    const stackLines = errorStack ? errorStack.split('\n').slice(0, 15).join('\n') : 'No stack';
    
    console.error('[AgentConfigController] Error updating agent config:', {
      requestId,
      method: 'PATCH',
      path: '/api/dashboard/agent/config',
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorMessage,
      stack: stackLines,
      errorType: typeof error,
      hasSupabase: !!(error as any).supabase,
      hasValidation: !!(error as any).validationError,
      hasStep: !!(error as any).step,
    });

    // Attach validation errors to error object for error handler
    if (error instanceof z.ZodError) {
      const validationError = new Error('Response validation failed');
      (validationError as any).step = 'validateResponse';
      (validationError as any).validationError = error.errors;
      throw validationError;
    }

    // Re-throw to let error handler process it (with debug mode support)
    throw error;
  }
};

