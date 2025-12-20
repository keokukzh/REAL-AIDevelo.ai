/**
 * Test Call Routes
 * Handles browser test call requests
 */

import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../services/supabaseDb';
import { logger, redact } from '../utils/logger';
import { verifySupabaseAuth, AuthenticatedRequest } from '../middleware/supabaseAuth';

const router = Router();

/**
 * POST /api/test-call/start
 * Start a WebRTC test call
 */
router.post('/start', verifySupabaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { location_id, agent_id } = req.body;

    if (!location_id) {
      return res.status(400).json({ error: 'location_id required' });
    }

    // Generate call_sid for WebRTC call
    const callSid = `webrtc_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Create call session
    const { data: session, error } = await supabaseAdmin
      .from('call_sessions')
      .insert({
        call_sid: callSid,
        location_id,
        agent_id: agent_id || null,
        direction: 'test',
        status: 'active',
        transcript_json: [],
      })
      .select()
      .single();

    if (error) {
      logger.error('test_call.start_failed', error, redact({ location_id }));
      return res.status(500).json({ error: 'Failed to create call session' });
    }

    logger.info('test_call.started', redact({ call_sid: callSid, location_id }));

    res.json({
      success: true,
      call_sid: callSid,
      session_id: session.id,
    });
  } catch (error: any) {
    logger.error('test_call.start_error', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/test-call/:sessionId/transcript
 * Get live transcript for test call
 */
router.get('/:sessionId/transcript', verifySupabaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;

    // Get call session by call_sid (sessionId is call_sid for WebRTC)
    const { data: session } = await supabaseAdmin
      .from('call_sessions')
      .select('transcript_json')
      .eq('call_sid', sessionId)
      .maybeSingle();

    if (!session) {
      return res.status(404).json({ error: 'Call session not found' });
    }

    res.json({
      success: true,
      transcript: session.transcript_json || [],
    });
  } catch (error: any) {
    logger.error('test_call.transcript_error', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/test-call/:sessionId/recording
 * Get recording URL for test call
 */
router.get('/:sessionId/recording', verifySupabaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;

    const { data: session } = await supabaseAdmin
      .from('call_sessions')
      .select('recording_url')
      .eq('call_sid', sessionId)
      .maybeSingle();

    if (!session) {
      return res.status(404).json({ error: 'Call session not found' });
    }

    res.json({
      success: true,
      recording_url: session.recording_url || null,
    });
  } catch (error: any) {
    logger.error('test_call.recording_error', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

