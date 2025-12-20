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

/**
 * GET /api/test-call/config
 * Get FreeSWITCH WebSocket configuration for test calls
 */
router.get('/config', verifySupabaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Get FreeSWITCH WebSocket URL from environment or use default
    // In production, this should point to the actual FreeSWITCH server
    // For now, use localhost for development or configured URL for production
    const freeswitchWssUrl = process.env.FREESWITCH_WSS_URL || 
      (process.env.NODE_ENV === 'production' 
        ? 'wss://aidevelo.ai:7443' 
        : 'wss://localhost:7443');
    
    const sipUsername = `test_${req.supabaseUser?.supabaseUserId || 'anonymous'}`;
    const sipPassword = process.env.FREESWITCH_TEST_PASSWORD || 'test123';
    const extension = process.env.FREESWITCH_TEST_EXTENSION || '1000';

    res.json({
      success: true,
      config: {
        wss_url: freeswitchWssUrl,
        sip_username: sipUsername,
        sip_password: sipPassword,
        extension,
      },
    });
  } catch (error: any) {
    logger.error('test_call.config_error', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

