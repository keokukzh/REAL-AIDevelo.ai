import { Router, Request, Response } from 'express';
import { config } from '../config/env';
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

    // Account SID must be set
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    if (!accountSid) {
      throw new Error('TWILIO_ACCOUNT_SID is not configured on server');
    }

    // Preferred: API Key & Secret
    const apiKey = config.twilioApiKeySid || process.env.TWILIO_API_KEY_SID;
    const apiSecret = config.twilioApiKeySecret || process.env.TWILIO_API_KEY_SECRET;

    // Fallback: Auth Token (less secure but works if same as Account SID)
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    // Determine final credentials
    const finalApiKey = apiKey || accountSid;
    const finalApiSecret = apiSecret || authToken;

    if (!finalApiKey || !finalApiSecret) {
      throw new Error('Twilio credentials (API Key or Auth Token) are missing');
    }

    // TwiML App SID for outgoing calls
    const appSid = process.env.TWILIO_TWIML_APP_SID;
    if (!appSid) {
      console.warn('[TestCall] TWILIO_TWIML_APP_SID is not set. Outgoing calls will fail.');
    }

    // Voice Grant erstellen
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: appSid,
      incomingAllow: true,
    });

    // Access Token erstellen
    const token = new AccessToken(accountSid, finalApiKey, finalApiSecret, {
      identity,
      ttl: 3600, // 1 Stunde gültig
    });

    token.addGrant(voiceGrant);

    console.log('[TestCall] Voice token generated successfully:', {
      identity,
      hasAppSid: !!appSid,
      credentialUsed: apiKey ? 'API_KEY' : 'AUTH_TOKEN',
    });

    res.json({
      success: true,
      token: token.toJwt(),
      identity,
      appSid: appSid || null,
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
  const callSid = req.body.CallSid || 'unknown';
  const locationIdFromParams = req.body.locationId;

  console.log('[TestCall] Incoming call request:', {
    callSid,
    locationId: locationIdFromParams,
    from: req.body.From,
  });

  try {
    let locationId = locationIdFromParams;

    // Wenn keine locationId im Body, lade die erste verfügbare (für Testzwecke)
    if (!locationId) {
      const { data: firstLoc } = await supabaseAdmin
        .from('locations')
        .select('id')
        .limit(1)
        .maybeSingle();
      locationId = firstLoc?.id;
    }

    if (!locationId) {
      const twiml = new twilio.twiml.VoiceResponse();
      twiml.say(
        { voice: 'alice' },
        'Keine Location-ID gefunden. Der Testruf kann nicht verarbeitet werden.',
      );
      res.type('text/xml').send(twiml.toString());
      return;
    }

    // WebSocket URL zusammenbauen
    const publicBaseUrl = process.env.PUBLIC_BASE_URL || `http://${req.headers.host}`;
    const wsBaseUrl = publicBaseUrl.replace(/^https:/i, 'wss:').replace(/^http:/i, 'ws:');
    const streamUrl = `${wsBaseUrl}/api/phone/media-stream`;

    console.log('[TestCall] Connecting to Media Stream:', {
      callSid,
      locationId,
      streamUrl,
    });

    const twiml = new twilio.twiml.VoiceResponse();
    const connect = twiml.connect();
    const stream = connect.stream({
      url: streamUrl,
    });
    stream.parameter({ name: 'locationId', value: locationId });

    res.type('text/xml').send(twiml.toString());
  } catch (error: any) {
    console.error('[TestCall] Error handling incoming call:', error);
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say({ voice: 'alice' }, 'Ein interner Fehler ist aufgetreten.');
    res.type('text/xml').send(twiml.toString());
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
