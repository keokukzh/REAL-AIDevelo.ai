import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/supabaseAuth';
import {
  ensureUserRow,
  ensureOrgForUser,
  ensureDefaultLocation,
  ensureAgentConfig,
  supabaseAdmin,
} from '../services/supabaseDb';
import { checkDbPreflight } from '../services/dbPreflight';
import { InternalServerError } from '../utils/errors';
import { z } from 'zod';

// Get backend version from environment (Render sets RENDER_GIT_COMMIT)
const getBackendVersion = (): string => {
  return process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || 'unknown';
};

// Response schemas
const DefaultAgentResponseSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    email: z.string().nullable(),
  }),
  organization: z.object({
    id: z.string().uuid(),
    name: z.string(),
  }),
  location: z.object({
    id: z.string().uuid(),
    name: z.string(),
    timezone: z.string(),
  }),
  agent_config: z.object({
    id: z.string().uuid(),
    eleven_agent_id: z.string().nullable(),
    setup_state: z.string(),
    persona_gender: z.string().nullable(),
    persona_age_range: z.string().nullable(),
    goals_json: z.array(z.string()),
    services_json: z.any(),
    business_type: z.string().nullable(),
  }),
  status: z.object({
    agent: z.enum(['ready', 'needs_setup']),
    phone: z.enum(['not_connected', 'connected', 'needs_compliance']),
    calendar: z.enum(['not_connected', 'connected']),
  }),
});

const DashboardOverviewResponseSchema = DefaultAgentResponseSchema.extend({
  recent_calls: z.array(
    z.object({
      id: z.string().uuid(),
      direction: z.string(),
      from_e164: z.string().nullable(),
      to_e164: z.string().nullable(),
      started_at: z.string(),
      ended_at: z.string().nullable(),
      duration_sec: z.number().nullable(),
      outcome: z.string().nullable(),
    })
  ),
});

type DefaultAgentResponse = z.infer<typeof DefaultAgentResponseSchema>;
type DashboardOverviewResponse = z.infer<typeof DashboardOverviewResponseSchema>;

/**
 * POST /api/agent/default
 * Idempotent: ensures user, org, location, and agent config exist
 */
export const createDefaultAgent = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Fail-fast: Check schema preflight
    const preflight = await checkDbPreflight();
    if (!preflight.ok) {
      return res.status(500).json({
        error: 'Supabase schema not applied',
        message: `Missing tables: ${preflight.missing.join(', ')}. Run server/db/schema.sql in Supabase SQL editor.`,
        missing: preflight.missing,
      });
    }

    if (!req.supabaseUser) {
      return next(new InternalServerError('User not authenticated'));
    }

    const { supabaseUserId, email } = req.supabaseUser;
    const { locationName } = req.body || {};

    // Step 1: Ensure user row exists
    const user = await ensureUserRow(supabaseUserId, email);

    // Step 2: Ensure organization exists (pass email for race condition handling)
    const org = await ensureOrgForUser(supabaseUserId, email);

    // Step 3: Ensure default location exists
    const location = await ensureDefaultLocation(org.id, locationName);

    // Step 4: Ensure agent config exists
    const agentConfig = await ensureAgentConfig(location.id);

    // Step 5: Load phone status
    const { data: phoneData } = await supabaseAdmin
      .from('phone_numbers')
      .select('status')
      .eq('location_id', location.id)
      .limit(1)
      .maybeSingle();

    const phoneStatus = phoneData?.status || 'not_connected';
    let phoneStatusEnum: 'not_connected' | 'connected' | 'needs_compliance' = 'not_connected';
    if (phoneStatus === 'connected') {
      phoneStatusEnum = 'connected';
    } else if (phoneStatus === 'compliance_needed') {
      phoneStatusEnum = 'needs_compliance';
    }

    // Step 6: Load calendar status
    const { data: calendarData } = await supabaseAdmin
      .from('google_calendar_integrations')
      .select('id')
      .eq('location_id', location.id)
      .limit(1)
      .maybeSingle();

    const calendarStatus: 'not_connected' | 'connected' = calendarData ? 'connected' : 'not_connected';

    // Determine agent status
    const agentStatus: 'ready' | 'needs_setup' =
      agentConfig.setup_state === 'ready' ? 'ready' : 'needs_setup';

    const response: DefaultAgentResponse = {
      user: {
        id: user.id,
        email: user.email || null,
      },
      organization: {
        id: org.id,
        name: org.name,
      },
      location: {
        id: location.id,
        name: location.name,
        timezone: location.timezone,
      },
      agent_config: {
        id: agentConfig.id,
        eleven_agent_id: agentConfig.eleven_agent_id,
        setup_state: agentConfig.setup_state,
        persona_gender: agentConfig.persona_gender,
        persona_age_range: agentConfig.persona_age_range,
        goals_json: agentConfig.goals_json,
        services_json: agentConfig.services_json,
        business_type: agentConfig.business_type,
      },
      status: {
        agent: agentStatus,
        phone: phoneStatusEnum,
        calendar: calendarStatus,
      },
    };

    // Validate response with Zod
    const validated = DefaultAgentResponseSchema.parse(response);

    res.json({
      success: true,
      data: validated,
    });
  } catch (error) {
    // Generate request ID for tracking
    const requestId = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Determine which step failed
    let failedStep = 'unknown';
    if (error instanceof Error) {
      if (error.message.includes('ensureUserRow') || error.message.includes('create organization') || error.message.includes('create user')) {
        failedStep = 'ensureUserRow';
      } else if (error.message.includes('ensureOrgForUser') || error.message.includes('Organization not found')) {
        failedStep = 'ensureOrgForUser';
      } else if (error.message.includes('ensureDefaultLocation') || error.message.includes('create location')) {
        failedStep = 'ensureDefaultLocation';
      } else if (error.message.includes('ensureAgentConfig') || error.message.includes('create agent config')) {
        failedStep = 'ensureAgentConfig';
      }
    }
    
    console.error('[DefaultAgentController] Error creating default agent:', {
      requestId,
      step: failedStep,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    if (error instanceof z.ZodError) {
      return res.status(500).json({
        error: 'Response validation failed',
        step: failedStep,
        requestId,
      });
    }
    
    return res.status(500).json({
      error: 'Failed to create default agent',
      step: failedStep,
      requestId,
    });
  }
};

/**
 * GET /api/dashboard/overview
 * Returns dashboard overview with recent calls
 */
export const getDashboardOverview = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Fail-fast: Check schema preflight
    const preflight = await checkDbPreflight();
    if (!preflight.ok) {
      return res.status(500).json({
        error: 'Supabase schema not applied',
        message: `Missing tables: ${preflight.missing.join(', ')}. Run server/db/schema.sql in Supabase SQL editor.`,
        missing: preflight.missing,
      });
    }

    if (!req.supabaseUser) {
      return next(new InternalServerError('User not authenticated'));
    }

    const { supabaseUserId, email } = req.supabaseUser;

    // Reuse the same ensure logic as POST /api/agent/default
    const user = await ensureUserRow(supabaseUserId, email);
    const org = await ensureOrgForUser(supabaseUserId, email);
    const location = await ensureDefaultLocation(org.id);
    const agentConfig = await ensureAgentConfig(location.id);

    // Load phone status
    const { data: phoneData } = await supabaseAdmin
      .from('phone_numbers')
      .select('status')
      .eq('location_id', location.id)
      .limit(1)
      .maybeSingle();

    const phoneStatus = phoneData?.status || 'not_connected';
    let phoneStatusEnum: 'not_connected' | 'connected' | 'needs_compliance' = 'not_connected';
    if (phoneStatus === 'connected') {
      phoneStatusEnum = 'connected';
    } else if (phoneStatus === 'compliance_needed') {
      phoneStatusEnum = 'needs_compliance';
    }

    // Load calendar status
    const { data: calendarData } = await supabaseAdmin
      .from('google_calendar_integrations')
      .select('id')
      .eq('location_id', location.id)
      .limit(1)
      .maybeSingle();

    const calendarStatus: 'not_connected' | 'connected' = calendarData ? 'connected' : 'not_connected';

    // Determine agent status
    const agentStatus: 'ready' | 'needs_setup' =
      agentConfig.setup_state === 'ready' ? 'ready' : 'needs_setup';

    // Load recent calls
    const { data: recentCalls, error: callsError } = await supabaseAdmin
      .from('call_logs')
      .select('id, direction, from_e164, to_e164, started_at, ended_at, duration_sec, outcome')
      .eq('location_id', location.id)
      .order('started_at', { ascending: false })
      .limit(10);

    if (callsError) {
      console.error('[DefaultAgentController] Error loading recent calls:', callsError);
    }

    const response: DashboardOverviewResponse = {
      user: {
        id: user.id,
        email: user.email || null,
      },
      organization: {
        id: org.id,
        name: org.name,
      },
      location: {
        id: location.id,
        name: location.name,
        timezone: location.timezone,
      },
      agent_config: {
        id: agentConfig.id,
        eleven_agent_id: agentConfig.eleven_agent_id,
        setup_state: agentConfig.setup_state,
        persona_gender: agentConfig.persona_gender,
        persona_age_range: agentConfig.persona_age_range,
        goals_json: agentConfig.goals_json,
        services_json: agentConfig.services_json,
        business_type: agentConfig.business_type,
      },
      status: {
        agent: agentStatus,
        phone: phoneStatusEnum,
        calendar: calendarStatus,
      },
      recent_calls: (recentCalls || []).map((call) => ({
        id: call.id,
        direction: call.direction,
        from_e164: call.from_e164 || null,
        to_e164: call.to_e164 || null,
        started_at: call.started_at,
        ended_at: call.ended_at || null,
        duration_sec: call.duration_sec || null,
        outcome: call.outcome || null,
      })),
    };

    // Validate response with Zod
    const validated = DashboardOverviewResponseSchema.parse(response);

    // Add backend version header (no secrets)
    res.setHeader('x-aidevelo-backend-sha', getBackendVersion());

    res.json({
      success: true,
      data: validated,
    });
  } catch (error) {
    // Generate request ID for tracking
    const requestId = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Determine which step failed
    let failedStep = 'unknown';
    if (error instanceof Error) {
      if (error.message.includes('ensureUserRow') || error.message.includes('create organization') || error.message.includes('create user')) {
        failedStep = 'ensureUserRow';
      } else if (error.message.includes('ensureOrgForUser') || error.message.includes('Organization not found')) {
        failedStep = 'ensureOrgForUser';
      } else if (error.message.includes('ensureDefaultLocation') || error.message.includes('create location')) {
        failedStep = 'ensureDefaultLocation';
      } else if (error.message.includes('ensureAgentConfig') || error.message.includes('create agent config')) {
        failedStep = 'ensureAgentConfig';
      } else if (error.message.includes('recent calls') || error.message.includes('call_logs')) {
        failedStep = 'loadRecentCalls';
      }
    }
    
    console.error('[DefaultAgentController] Error getting dashboard overview:', {
      requestId,
      step: failedStep,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    if (error instanceof z.ZodError) {
      return res.status(500).json({
        error: 'Response validation failed',
        step: failedStep,
        requestId,
      });
    }
    
    return res.status(500).json({
      error: 'Failed to get dashboard overview',
      step: failedStep,
      requestId,
    });
  }
};


