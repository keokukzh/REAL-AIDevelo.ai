/**
 * Test Call Routes
 * Handles browser test call requests
 */

import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../services/supabaseDb';
import { logger, redact } from '../utils/logger';
import { verifySupabaseAuth, AuthenticatedRequest } from '../middleware/supabaseAuth';
import { agentCore } from '../core/agent/agentCore';
import { ttsService } from '../services/ttsService';

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
 * GET /api/test-call/config
 * Get FreeSWITCH WebSocket configuration for test calls
 */
router.get('/config', verifySupabaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Get FreeSWITCH WebSocket URL from environment or use default
    // In production, this should point to the actual FreeSWITCH server via Cloudflare Tunnel
    const freeswitchWssUrl = process.env.FREESWITCH_WSS_URL || 
      (process.env.NODE_ENV === 'production' 
        ? 'wss://freeswitch.aidevelo.ai'  // Changed from aidevelo.ai:7443 to freeswitch.aidevelo.ai
        : 'wss://localhost:7443');
    
    const sipUsername = 'test';
    const sipPassword = process.env.FREESWITCH_TEST_PASSWORD || 'test123';
    const extension = process.env.FREESWITCH_TEST_EXTENSION || '1000';

    logger.info('test_call.config_requested', {
      freeswitchWssUrl,
      hasEnvVar: !!process.env.FREESWITCH_WSS_URL,
      nodeEnv: process.env.NODE_ENV,
    });

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
    logger.error('test_call.config_error', error, {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * POST /api/v1/test-call/chat-message
 * Handle chat message in test call (text input with voice response)
 * Agent responds with text + TTS audio (always voice mode)
 * IMPORTANT: This route must be defined BEFORE parametrized routes like /:sessionId/*
 */
router.post('/chat-message', verifySupabaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { location_id, text, call_sid, metadata } = req.body;

    if (!location_id || !text) {
      return res.status(400).json({
        success: false,
        error: 'location_id and text are required',
      });
    }

    // Generate call_sid if not provided (for chat-only mode)
    const effectiveCallSid = call_sid || `chat_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    logger.info('test_call.chat_message', redact({
      location_id,
      textLength: text.length,
      call_sid: effectiveCallSid,
    }));

    // Step 1: Get agent response using AgentCore (same as voice mode)
    let agentResponse;
    try {
      agentResponse = await agentCore.handleMessage({
        locationId: location_id,
        channel: 'voice', // Use voice channel for voice-optimized responses
        externalUserId: `test_call_${effectiveCallSid}`,
        text: text.trim(),
        metadata: {
          ...metadata,
          call_sid: effectiveCallSid,
          test_call: true,
          chat_mode: true,
        },
      });
    } catch (error: any) {
      logger.error('test_call.agent_core_failed', error, redact({ location_id }));
      return res.status(200).json({
        success: false,
        error: `AgentCore Fehler: ${error.message}. Bitte API-Keys prüfen.`
      });
    }

    // Step 2: Get voice preset for location
    const { data: agentConfig } = await supabaseAdmin
      .from('agent_configs')
      .select('voice_profile_id')
      .eq('location_id', location_id)
      .maybeSingle();

    let voicePreset = 'SwissProfessionalDE'; // Default
    if (agentConfig?.voice_profile_id) {
      const { data: voiceProfile } = await supabaseAdmin
        .from('voice_profiles')
        .select('preset')
        .eq('id', agentConfig.voice_profile_id)
        .maybeSingle();

      if (voiceProfile?.preset) {
        voicePreset = voiceProfile.preset;
      }
    }

    // Step 3: Generate TTS audio
    let audioPath;
    try {
      audioPath = await ttsService.synthesizeToFile(
        agentResponse.text,
        voicePreset,
        { language: 'de', speed: 1.0 }
      );
    } catch (error: any) {
      logger.error('test_call.tts_failed', error, redact({ location_id }));
      // Non-fatal if chat mode: still return the text response
      return res.json({
        success: true,
        data: {
          text: agentResponse.text,
          toolCalls: agentResponse.toolCalls,
          audioUrl: null,
          error: `TTS Fehler: ${error.message}`
        }
      });
    }

    // Step 4: Convert local file path to HTTP URL
    const path = require('path');
    const filename = path.basename(audioPath);
    const publicBaseUrl = process.env.PUBLIC_BASE_URL || 'https://real-aidevelo-ai.onrender.com';
    const audioUrl = `${publicBaseUrl}/api/v1/freeswitch/audio/${filename}`;

    logger.info('test_call.chat_message_complete', redact({
      location_id,
      textLength: agentResponse.text.length,
      audioUrl,
      hasToolCalls: !!agentResponse.toolCalls && agentResponse.toolCalls.length > 0,
    }));

    res.json({
      success: true,
      text: agentResponse.text,
      audio_url: audioUrl,
      toolCalls: agentResponse.toolCalls,
    });
  } catch (error: any) {
    logger.error('test_call.chat_message_error', error, redact({
      location_id: req.body?.location_id,
    }));

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process chat message',
    });
  }
});

/**
 * GET /api/test-call/:sessionId/transcript
 * Get live transcript for test call
 * IMPORTANT: Parametrized routes must come AFTER specific routes like /chat-message
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

