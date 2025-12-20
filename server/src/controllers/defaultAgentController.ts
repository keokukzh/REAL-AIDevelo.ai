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
import { InternalServerError, BadRequestError } from '../utils/errors';
import { twilioService } from '../services/twilioService';
import { z } from 'zod';
import { cacheService, CacheKeys, CacheTTL } from '../services/cacheService';
import { StructuredLoggingService } from '../services/loggingService';

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
    greeting_template: z.string().nullable().optional(),
    company_name: z.string().nullable().optional(),
    booking_required_fields_json: z.array(z.string()).optional(),
    booking_default_duration_min: z.number().optional(),
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
  phone_number: z.string().nullable().optional(),
  phone_number_sid: z.string().nullable().optional(),
  calendar_provider: z.string().nullable().optional(),
  calendar_connected_email: z.string().nullable().optional(),
  last_activity: z.string().nullable().optional(),
  gateway_health: z.enum(['ok', 'warning', 'error']).optional(),
});

type DefaultAgentResponse = z.infer<typeof DefaultAgentResponseSchema>;
type DashboardOverviewResponse = z.infer<typeof DashboardOverviewResponseSchema>;

/**
 * POST /api/agent/default
 * Idempotent: ensures user, org, location, and agent config exist
 * 
 * This endpoint is idempotent - multiple calls with the same user will not create duplicates.
 * It ensures all required resources exist: user row, organization, default location, and agent config.
 * 
 * @param req - Authenticated request with supabaseUser
 * @param res - Express response
 * @param next - Express next function for error handling
 * @returns JSON response with user, organization, location, agent_config, and status
 * @throws {InternalServerError} If any step fails (user creation, org creation, location creation, agent config creation)
 * 
 * @example
 * ```typescript
 * POST /api/agent/default
 * Body: { locationName?: string }
 * Response: {
 *   success: true,
 *   data: {
 *     user: { id: string, email: string },
 *     organization: { id: string, name: string },
 *     location: { id: string, name: string, timezone: string },
 *     agent_config: { id: string, setup_state: string, ... },
 *     status: { agent: 'ready' | 'needs_setup', phone: 'not_connected' | 'connected' | 'needs_compliance', calendar: 'not_connected' | 'connected' }
 *   }
 * }
 * ```
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
        greeting_template: (agentConfig as any).greeting_template ?? null,
        company_name: (agentConfig as any).company_name ?? null,
        booking_required_fields_json: Array.isArray((agentConfig as any).booking_required_fields_json)
          ? (agentConfig as any).booking_required_fields_json
          : [],
        booking_default_duration_min: (agentConfig as any).booking_default_duration_min ?? 30,
      },
      status: {
        agent: agentStatus,
        phone: phoneStatusEnum,
        calendar: calendarStatus,
      },
    };

    // Validate response with Zod
    const validated = DefaultAgentResponseSchema.parse(response);

    // Add backend version header (no secrets)
    res.setHeader('x-aidevelo-backend-sha', getBackendVersion());

    res.json({
      success: true,
      data: validated,
    });
  } catch (error) {
    // Generate request ID for tracking
    const requestIdHeader = req.headers['x-request-id'];
    const requestId = Array.isArray(requestIdHeader) 
      ? requestIdHeader[0] 
      : requestIdHeader || `req-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    
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
    
    StructuredLoggingService.error(
      'Error creating default agent',
      error instanceof Error ? error : new Error('Unknown error'),
      {
        requestId,
        step: failedStep,
      },
      req
    );
    
    // Use next(error) pattern for consistent error handling
    const appError = error instanceof z.ZodError
      ? new InternalServerError('Response validation failed')
      : new InternalServerError('Failed to create default agent');
    
    // Add step and requestId to error for debugging
    (appError as any).step = failedStep;
    (appError as any).requestId = requestId;
    
    next(appError);
  }
};

/**
 * GET /api/dashboard/overview
 * Returns dashboard overview with recent calls, phone status, and calendar status
 * 
 * This endpoint provides a comprehensive overview of the user's dashboard including:
 * - User and organization information
 * - Location details
 * - Agent configuration and status
 * - Phone connection status
 * - Calendar integration status
 * - Recent call history (last 10 calls)
 * 
 * The response is cached for 30 seconds to reduce database load.
 * 
 * @param req - Authenticated request with supabaseUser
 * @param res - Express response
 * @param next - Express next function for error handling
 * @returns JSON response with dashboard overview data
 * @throws {InternalServerError} If any step fails (user/org/location/agent config creation, data fetching)
 * 
 * @example
 * ```typescript
 * GET /api/dashboard/overview
 * Response: {
 *   success: true,
 *   data: {
 *     user: { id: string, email: string },
 *     organization: { id: string, name: string },
 *     location: { id: string, name: string, timezone: string },
 *     agent_config: { id: string, setup_state: string, ... },
 *     status: { agent: 'ready', phone: 'connected', calendar: 'connected' },
 *     recent_calls: [...],
 *     phone_number: string | null,
 *     calendar_provider: string | null,
 *     last_activity: string | null
 *   }
 * }
 * ```
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

    // Check cache first (user-specific cache key)
    const cacheKey = CacheKeys.dashboardOverview(supabaseUserId);
    const cached = await cacheService.get<DashboardOverviewResponse>(cacheKey);
    
    if (cached) {
      // Add cache hit header
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('x-aidevelo-backend-sha', getBackendVersion());
      
      return res.json({
        success: true,
        data: cached,
      });
    }

    // Reuse the same ensure logic as POST /api/agent/default
    // These must remain sequential as they depend on each other
    const user = await ensureUserRow(supabaseUserId, email);
    const org = await ensureOrgForUser(supabaseUserId, email);
    const location = await ensureDefaultLocation(org.id);
    const agentConfig = await ensureAgentConfig(location.id);

    // Determine agent status (depends on agentConfig)
    const agentStatus: 'ready' | 'needs_setup' =
      agentConfig.setup_state === 'ready' ? 'ready' : 'needs_setup';

    // Parallelize independent queries for better performance
    // All three queries depend only on location.id, so they can run in parallel
    const [phoneResult, calendarResult, callsResult] = await Promise.all([
      // Load phone status and number
      supabaseAdmin
        .from('phone_numbers')
        .select('status, e164, customer_public_number, twilio_number_sid')
        .eq('location_id', location.id)
        .limit(1)
        .maybeSingle(),
      // Load calendar status and provider
      supabaseAdmin
        .from('google_calendar_integrations')
        .select('id, provider, connected_email')
        .eq('location_id', location.id)
        .eq('provider', 'google')
        .limit(1)
        .maybeSingle(),
      // Load recent calls
      supabaseAdmin
        .from('call_logs')
        .select('id, direction, from_e164, to_e164, started_at, ended_at, duration_sec, outcome')
        .eq('location_id', location.id)
        .order('started_at', { ascending: false })
        .limit(10),
    ]);

    const phoneData = phoneResult.data;
    const calendarData = calendarResult.data;
    const { data: recentCalls, error: callsError } = callsResult;

    if (callsError) {
      console.error('[DefaultAgentController] Error loading recent calls:', callsError);
    }

    // Process phone status
    const phoneStatus = phoneData?.status || 'not_connected';
    let phoneStatusEnum: 'not_connected' | 'connected' | 'needs_compliance' = 'not_connected';
    if (phoneStatus === 'connected') {
      phoneStatusEnum = 'connected';
    } else if (phoneStatus === 'compliance_needed') {
      phoneStatusEnum = 'needs_compliance';
    }
    const phoneNumber = phoneData?.e164 || phoneData?.customer_public_number || null;

    // Compute Twilio Gateway health
    // Green when: phone connected + Twilio creds present + webhook URL configured
    const publicBaseUrl = process.env.PUBLIC_BASE_URL || '';
    const hasTwilioCreds = !!(process.env.TWILIO_AUTH_TOKEN || (process.env.TWILIO_API_KEY_SID && process.env.TWILIO_API_KEY_SECRET));
    const hasWebhookUrl = !!publicBaseUrl;
    const expectedWebhookUrl = publicBaseUrl ? `${publicBaseUrl}/api/twilio/voice/inbound` : null;
    
    let gatewayHealth: 'ok' | 'warning' | 'error' = 'error';
    if (phoneStatusEnum === 'connected' && hasTwilioCreds && hasWebhookUrl) {
      gatewayHealth = 'ok';
    } else if (phoneStatusEnum === 'connected' || hasTwilioCreds) {
      gatewayHealth = 'warning'; // Partial setup
    }

    // Process calendar status
    const calendarStatus: 'not_connected' | 'connected' = calendarData ? 'connected' : 'not_connected';
    const calendarProvider = calendarData?.provider || null;

    // Calculate last activity (most recent call timestamp)
    const lastActivity = recentCalls && recentCalls.length > 0 
      ? recentCalls[0].started_at 
      : null;

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
        greeting_template: (agentConfig as any).greeting_template ?? null,
        company_name: (agentConfig as any).company_name ?? null,
        booking_required_fields_json: Array.isArray((agentConfig as any).booking_required_fields_json)
          ? (agentConfig as any).booking_required_fields_json
          : [],
        booking_default_duration_min: (agentConfig as any).booking_default_duration_min ?? 30,
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
      phone_number: phoneNumber,
      phone_number_sid: phoneData?.twilio_number_sid || null,
      calendar_provider: calendarProvider,
      calendar_connected_email: calendarData?.connected_email || null,
      last_activity: lastActivity,
      gateway_health: gatewayHealth,
    };

    // Validate response with Zod
    const validated = DashboardOverviewResponseSchema.parse(response);

    // Cache the response (30s TTL for near-real-time data)
    await cacheService.set(cacheKey, validated, CacheTTL.dashboardOverview);

    // Add backend version header (no secrets)
    res.setHeader('x-aidevelo-backend-sha', getBackendVersion());
    res.setHeader('X-Cache', 'MISS');

    res.json({
      success: true,
      data: validated,
    });
  } catch (error) {
    // Generate request ID for tracking
    const requestIdHeader = req.headers['x-request-id'];
    const requestId = Array.isArray(requestIdHeader) 
      ? requestIdHeader[0] 
      : requestIdHeader || `req-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    
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
    
    StructuredLoggingService.error(
      'Error getting dashboard overview',
      error instanceof Error ? error : new Error('Unknown error'),
      {
        requestId,
        step: failedStep,
      },
      req
    );
    
    // Use next(error) pattern for consistent error handling
    const appError = error instanceof z.ZodError
      ? new InternalServerError('Response validation failed')
      : new InternalServerError('Failed to get dashboard overview');
    
    // Add step and requestId to error for debugging
    (appError as any).step = failedStep;
    (appError as any).requestId = requestId;
    
    next(appError);
  }
};

/**
 * POST /api/agent/test-call
 * Initiate a test call for the agent
 * 
 * Creates an outbound call via Twilio to test the voice agent.
 * Requires a connected phone number for the location.
 * 
 * @param req - Authenticated request with body: { to: string }
 * @param res - Express response
 * @param next - Express next function for error handling
 * @returns JSON response with call SID and status
 * @throws {BadRequestError} If phone number not connected or missing 'to' parameter
 * @throws {InternalServerError} If PUBLIC_BASE_URL not configured or Twilio call fails
 * 
 * @example
 * ```typescript
 * POST /api/agent/test-call
 * Body: { to: '+41123456789' }
 * Response: {
 *   success: true,
 *   data: {
 *     callSid: 'CA...',
 *     status: 'queued',
 *     from: '+41...',
 *     to: '+41123456789'
 *   }
 * }
 * ```
 */
export const testAgentCall = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.supabaseUser) {
      return next(new InternalServerError('User not authenticated'));
    }

    const { to } = req.body;

    if (!to || typeof to !== 'string') {
      return next(new BadRequestError('to phone number is required'));
    }

    const { supabaseUserId, email } = req.supabaseUser;

    // Get user's location (same pattern as dashboard overview)
    await ensureUserRow(supabaseUserId, email);
    const org = await ensureOrgForUser(supabaseUserId, email);
    const location = await ensureDefaultLocation(org.id);
    await ensureAgentConfig(location.id);

    // Get the connected phone number for this location
    const { data: phoneData } = await supabaseAdmin
      .from('phone_numbers')
      .select('e164, twilio_number_sid')
      .eq('location_id', location.id)
      .eq('status', 'connected')
      .limit(1)
      .maybeSingle();

    if (!phoneData?.e164) {
      return next(new BadRequestError('No connected phone number found. Please connect a phone number first.'));
    }

    // Get agent config to check for admin_test_number
    const { data: agentConfig } = await supabaseAdmin
      .from('agent_configs')
      .select('admin_test_number')
      .eq('location_id', location.id)
      .maybeSingle();

    // Use admin_test_number if provided, otherwise use the 'to' parameter
    const targetNumber = (agentConfig?.admin_test_number && agentConfig.admin_test_number.trim()) 
      ? agentConfig.admin_test_number.trim() 
      : to;

    const publicBaseUrl = process.env.PUBLIC_BASE_URL || '';
    if (!publicBaseUrl) {
      return next(new InternalServerError('PUBLIC_BASE_URL not configured'));
    }

    const voiceUrl = `${publicBaseUrl}/api/twilio/voice/inbound`;

    // Make the call via Twilio (from connected number to targetNumber)
    const callResult = await twilioService.makeCall(phoneData.e164, targetNumber, voiceUrl);

    // Create a call log entry
    const { error: insertError } = await supabaseAdmin.from('call_logs').insert({
      location_id: location.id,
      call_sid: callResult.sid,
      direction: 'outbound',
      from_e164: phoneData.e164,
      to_e164: targetNumber,
      started_at: new Date().toISOString(),
      outcome: callResult.status,
      notes_json: {
        testCall: true,
        initiatedBy: email || 'unknown',
        agentTest: true,
        usedAdminTestNumber: !!agentConfig?.admin_test_number,
      },
    });

    if (insertError) {
      console.error('[DefaultAgentController] Error inserting call log:', insertError);
      // Don't fail the request if logging fails, but log it
    }

    console.log('[DefaultAgentController] Test call initiated', {
      org_id: org.id,
      location_id: location.id,
      call_sid: callResult.sid,
      from: phoneData.e164,
      to: targetNumber,
      usedAdminTestNumber: !!agentConfig?.admin_test_number,
      status: callResult.status,
    });

    res.json({
      success: true,
      data: {
        callSid: callResult.sid,
        status: callResult.status,
        from: callResult.from,
        to: callResult.to,
        usedAdminTestNumber: !!agentConfig?.admin_test_number,
      },
    });
  } catch (error) {
    StructuredLoggingService.error(
      'Error initiating test call',
      error instanceof Error ? error : new Error(String(error)),
      {},
      req
    );
    next(error);
  }
};


