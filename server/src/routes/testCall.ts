import { Router, Request, Response } from 'express';
import twilio from 'twilio';
import { supabaseAdmin } from '../services/supabaseDb';
import { logger, redact } from '../utils/logger';
import {
  verifySupabaseAuth as authenticateToken,
  AuthenticatedRequest,
} from '../middleware/supabaseAuth';
import { agentCore } from '../core/agent/agentCore';
import { ttsService } from '../services/ttsService';
import path from 'path';

const router = Router();
const AccessToken = twilio.jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

// Voice Token generieren für WebRTC
router.get('/voice-token', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const identity = `user_${req.supabaseUser?.id || 'guest'}_${Date.now()}`;

    // Voice Grant erstellen
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID,
      incomingAllow: true,
    });

    // Access Token erstellen
    const token = new AccessToken(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_ACCOUNT_SID!, // Als API Key
      process.env.TWILIO_AUTH_TOKEN!, // Als API Secret
      {
        identity,
        ttl: 3600, // 1 Stunde gültig
      },
    );

    token.addGrant(voiceGrant);

    console.log('[TestCall] Voice token generated for:', identity);

    res.json({
      success: true,
      token: token.toJwt(),
      identity,
      appSid: process.env.TWILIO_TWIML_APP_SID,
    });
  } catch (error: any) {
    console.error('[TestCall] Error generating voice token:', error);
    res.status(500).json({
      success: false,
      error: 'Token generation failed',
      details: error.message,
    });
  }
});

// TwiML für eingehende Test-Anrufe
router.post('/incoming-call', async (req: Request, res: Response) => {
  try {
    const twiml = new twilio.twiml.VoiceResponse();

    // Weiterleitung an Voice Agent
    twiml.dial().client('agent');

    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error('[TestCall] Error handling incoming call:', error);
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

/**
 * Handle chat message in test call (text input with voice response)
 */
router.post(
  '/chat-message',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { location_id, text, call_sid, metadata } = req.body;

      if (!location_id || !text) {
        return res.status(400).json({
          success: false,
          error: 'location_id and text are required',
        });
      }

      const effectiveCallSid =
        call_sid || `chat_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      logger.info(
        'test_call.chat_message',
        redact({
          location_id,
          textLength: text.length,
          call_sid: effectiveCallSid,
        }),
      );

      // Get agent response
      let agentResponse;
      try {
        agentResponse = await agentCore.handleMessage({
          locationId: location_id,
          channel: 'voice',
          externalUserId: `test_call_${effectiveCallSid}`,
          text: text.trim(),
          metadata: {
            ...(metadata || {}),
            call_sid: effectiveCallSid,
            test_call: true,
            chat_mode: true,
          },
        });
      } catch (error: any) {
        logger.error('test_call.agent_core_failed', error, redact({ location_id }));
        return res.status(200).json({
          success: false,
          error: `AgentCore Fehler: ${error.message}`,
        });
      }

      // Get voice preset
      const { data: agentConfig } = await supabaseAdmin
        .from('agent_configs')
        .select('voice_profile_id')
        .eq('location_id', location_id)
        .maybeSingle();

      let voicePreset = 'SwissProfessionalDE';
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

      // Generate TTS audio
      let audioPath;
      try {
        audioPath = await ttsService.synthesizeToFile(agentResponse.text, voicePreset, {
          language: 'de',
          speed: 1.0,
        });
      } catch (error: any) {
        logger.error('test_call.tts_failed', error, redact({ location_id }));
        return res.json({
          success: true,
          text: agentResponse.text,
          audio_url: null,
          toolCalls: agentResponse.toolCalls,
        });
      }

      const filename = path.basename(audioPath);
      const publicBaseUrl = process.env.PUBLIC_BASE_URL || 'https://aidevelo.ai';
      const audioUrl = `${publicBaseUrl}/api/v1/freeswitch/audio/${filename}`;

      res.json({
        success: true,
        text: agentResponse.text,
        audio_url: audioUrl,
        toolCalls: agentResponse.toolCalls,
      });
    } catch (error: any) {
      logger.error(
        'test_call.chat_message_error',
        error,
        redact({ location_id: req.body?.location_id }),
      );
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to process chat message',
      });
    }
  },
);

/**
 * Get live transcript for test call
 */
router.get(
  '/:sessionId/transcript',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { sessionId } = req.params;
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
  },
);

export default router;
