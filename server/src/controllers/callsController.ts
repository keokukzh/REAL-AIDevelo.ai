import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/supabaseAuth';
import { twilioService } from '../services/twilioService';
import { supabaseAdmin, ensureDefaultLocation } from '../services/supabaseDb';
import { BadRequestError, InternalServerError } from '../utils/errors';

/**
 * GET /api/calls/recent
 * Fetch latest calls
 */
export const getRecentCalls = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.supabaseUser) {
      return next(new InternalServerError('User not authenticated'));
    }

    const { supabaseUserId } = req.supabaseUser;

    // Get user's location
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('supabase_user_id', supabaseUserId)
      .single();

    if (!userData) {
      return next(new InternalServerError('User not found'));
    }

    const { data: orgData } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('owner_user_id', userData.id)
      .single();

    if (!orgData) {
      return next(new InternalServerError('Organization not found'));
    }

    const location = await ensureDefaultLocation(orgData.id);

    const { limit = '10' } = req.query;
    const limitNum = Number.parseInt(limit as string, 10) || 10;

    // Load recent calls
    const { data: recentCalls, error: callsError } = await supabaseAdmin
      .from('call_logs')
      .select('id, call_sid, direction, from_e164, to_e164, started_at, ended_at, duration_sec, outcome, notes_json')
      .eq('location_id', location.id)
      .order('started_at', { ascending: false })
      .limit(limitNum);

    if (callsError) {
      console.error('[CallsController] Error loading recent calls:', callsError);
      return next(new InternalServerError('Failed to load recent calls'));
    }

    res.json({
      success: true,
      data: (recentCalls || []).map((call) => ({
        id: call.id,
        callSid: call.call_sid,
        direction: call.direction,
        from_e164: call.from_e164 || null,
        to_e164: call.to_e164 || null,
        started_at: call.started_at,
        ended_at: call.ended_at || null,
        duration_sec: call.duration_sec || null,
        outcome: call.outcome || null,
        notes: call.notes_json || {},
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/calls/test
 * Place a test call (Twilio Calls API)
 */
export const testCall = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.supabaseUser) {
      return next(new InternalServerError('User not authenticated'));
    }

    const { from, to } = req.body;

    if (!from || !to) {
      return next(new BadRequestError('from and to phone numbers are required'));
    }

    const { supabaseUserId } = req.supabaseUser;

    // Get user's location
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('supabase_user_id', supabaseUserId)
      .single();

    if (!userData) {
      return next(new InternalServerError('User not found'));
    }

    const { data: orgData } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('owner_user_id', userData.id)
      .single();

    if (!orgData) {
      return next(new InternalServerError('Organization not found'));
    }

    const location = await ensureDefaultLocation(orgData.id);

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

    const publicBaseUrl = process.env.PUBLIC_BASE_URL || '';
    if (!publicBaseUrl) {
      return next(new InternalServerError('PUBLIC_BASE_URL not configured'));
    }

    const voiceUrl = `${publicBaseUrl}/api/twilio/voice/inbound`;

    // Make the call via Twilio
    const callResult = await twilioService.makeCall(phoneData.e164, to, voiceUrl);

    // Create a call log entry
    await supabaseAdmin.from('call_logs').insert({
      location_id: location.id,
      call_sid: callResult.sid,
      direction: 'outbound',
      from_e164: phoneData.e164,
      to_e164: to,
      started_at: new Date().toISOString(),
      outcome: callResult.status,
      notes_json: {
        testCall: true,
        initiatedBy: req.supabaseUser.email || 'unknown',
      },
    });

    res.json({
      success: true,
      data: {
        callSid: callResult.sid,
        status: callResult.status,
        from: callResult.from,
        to: callResult.to,
      },
    });
  } catch (error) {
    next(error);
  }
};
