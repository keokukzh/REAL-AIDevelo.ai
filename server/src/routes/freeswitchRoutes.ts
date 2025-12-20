/**
 * FreeSWITCH Routes
 * Handles FreeSWITCH call events and call control
 */

import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../services/supabaseDb';
import { callSessionManager } from '../core/voice/callSessionManager';
import { logger, redact } from '../utils/logger';

const router = Router();

/**
 * POST /api/freeswitch/call/start
 * Called when FreeSWITCH call starts
 */
router.post('/call/start', async (req: Request, res: Response) => {
  try {
    const { call_sid, location_id, agent_id } = req.body;

    if (!call_sid || !location_id) {
      return res.status(400).json({ error: 'call_sid and location_id required' });
    }

    // Create call session in DB
    const { data: session, error } = await supabaseAdmin
      .from('call_sessions')
      .insert({
        call_sid,
        location_id,
        agent_id: agent_id || null,
        direction: 'test', // Can be 'inbound', 'outbound', or 'test'
        status: 'active',
        transcript_json: [],
      })
      .select()
      .single();

    if (error) {
      logger.error('freeswitch.call_start_failed', error, redact({ call_sid, location_id }));
      return res.status(500).json({ error: 'Failed to create call session' });
    }

    logger.info('freeswitch.call_started', redact({ call_sid, location_id, agent_id }));

    res.json({ success: true, session_id: session.id });
  } catch (error: any) {
    logger.error('freeswitch.call_start_error', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/freeswitch/call/process-turn
 * Process a turn: ASR → LLM → TTS
 */
router.post('/call/process-turn', async (req: Request, res: Response) => {
  try {
    const { call_sid, location_id, agent_id, audio } = req.body;

    if (!call_sid || !location_id || !audio) {
      return res.status(400).json({ error: 'call_sid, location_id, and audio required' });
    }

    // Decode base64 audio
    const audioBuffer = Buffer.from(audio, 'base64');

    // Process turn using CallSessionManager
    const result = await callSessionManager.processTurn(call_sid, audioBuffer, 'de');

    if (!result.transcription || result.transcription.trim().length === 0) {
      // No speech detected
      return res.json({
        success: true,
        audio_url: null,
        text: '',
        message: 'No speech detected',
      });
    }

    res.json({
      success: true,
      audio_url: result.audioUrl,
      text: result.text,
      transcription: result.transcription,
    });
  } catch (error: any) {
    logger.error('freeswitch.process_turn_error', error, redact({
      call_sid: req.body?.call_sid,
    }));

    // Return fallback response
    res.json({
      success: false,
      audio_url: null,
      text: 'Entschuldigung, es ist ein Fehler aufgetreten.',
      error: error.message,
    });
  }
});

/**
 * POST /api/freeswitch/call/hangup
 * Called when FreeSWITCH call ends
 */
router.post('/call/hangup', async (req: Request, res: Response) => {
  try {
    const { call_sid, location_id, agent_id } = req.body;

    if (!call_sid) {
      return res.status(400).json({ error: 'call_sid required' });
    }

    // End session using CallSessionManager
    await callSessionManager.endSession(call_sid);

    logger.info('freeswitch.call_ended', redact({ call_sid, location_id }));

    res.json({ success: true });
  } catch (error: any) {
    logger.error('freeswitch.call_hangup_error', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/freeswitch/greeting
 * Get greeting audio for call start
 */
router.get('/greeting', async (req: Request, res: Response) => {
  try {
    const { location_id, agent_id } = req.query;

    if (!location_id) {
      return res.status(400).json({ error: 'location_id required' });
    }

    // Get agent config for greeting text
    const { data: agentConfig } = await supabaseAdmin
      .from('agent_configs')
      .select('booking_greeting')
      .eq('location_id', location_id as string)
      .maybeSingle();

    // Get greeting using CallSessionManager
    const audio = await callSessionManager.getGreeting(location_id as string);

    res.setHeader('Content-Type', 'audio/wav');
    res.send(audio);
  } catch (error: any) {
    logger.error('freeswitch.greeting_error', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/freeswitch/did-routing
 * Route DID (phone number) to location_id
 */
router.get('/did-routing', async (req: Request, res: Response) => {
  try {
    const { did } = req.query;

    if (!did) {
      return res.status(400).json({ error: 'did (destination number) required' });
    }

    // Find location by phone number
    const { data: phoneNumber } = await supabaseAdmin
      .from('phone_numbers')
      .select('location_id')
      .or(`e164.eq.${did},customer_public_number.eq.${did}`)
      .maybeSingle();

    if (phoneNumber?.location_id) {
      res.json({ location_id: phoneNumber.location_id });
    } else {
      res.status(404).json({ error: 'Location not found for DID' });
    }
  } catch (error: any) {
    logger.error('freeswitch.did_routing_error', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

