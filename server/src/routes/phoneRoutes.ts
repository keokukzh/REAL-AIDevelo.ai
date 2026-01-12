import { Router } from 'express';
// @ts-ignore
import { jwt, twiml } from 'twilio';
import { verifySupabaseAuth } from '../middleware/supabaseAuth';
import { verifyTwilioSignature } from '../middleware/verifyTwilioSignature';
import {
  listPhoneNumbers,
  connectPhoneNumber,
  getWebhookStatus,
  testWebhook,
} from '../controllers/phoneController';

const router = Router();
const AccessToken = jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

/**
 * GET /api/phone/numbers
 * List available Twilio phone numbers
 */
router.get('/numbers', verifySupabaseAuth, listPhoneNumbers);

/**
 * POST /api/phone/connect
 * Save selected phone number in DB
 */
router.post('/connect', verifySupabaseAuth, connectPhoneNumber);

/**
 * GET /api/phone/webhook-status
 * Check Twilio voice_url/status_callback configuration
 */
router.get('/webhook-status', verifySupabaseAuth, getWebhookStatus);

/**
 * POST /api/phone/test-webhook
 * Test webhook configuration (dev/test only)
 * Only registered if NODE_ENV !== 'production'
 */
if (process.env.NODE_ENV !== 'production') {
  router.post('/test-webhook', verifySupabaseAuth, testWebhook);
}

/**
 * GET /api/phone/health
 * Check Twilio Gateway health status
 */
router.get('/health', verifySupabaseAuth, async (req, res, next) => {
  try {
    const { checkTwilioGatewayHealth } = await import('../controllers/phoneController');
    return checkTwilioGatewayHealth(req as any, res, next);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/phone/token
 * Generate Twilio Access Token for Browser Client
 */
router.post('/token', verifySupabaseAuth, (req, res) => {
  try {
    // Use authenticated user ID as identity
    const identity = (req as any).user?.id || 'unknown_user';

    const token = new AccessToken(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_API_KEY_SID!,
      process.env.TWILIO_API_KEY_SECRET!,
      { identity },
    );

    token.addGrant(
      new VoiceGrant({
        outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID!,
        incomingAllow: true,
      }),
    );

    res.json({ token: token.toJwt() });
  } catch (error: any) {
    console.error('Error generating token:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/phone/voice
 * Handle incoming voice calls (TwiML Hook)
 * Verified by Twilio Signature
 */
router.post('/voice', verifyTwilioSignature, (req, res) => {
  const response = new twiml.VoiceResponse();
  const connect = response.connect();

  // Construct the WSS URL.
  // We expect calls to connect to our media stream handler
  const host = req.headers.host || req.hostname;
  const wssUrl = `wss://${host}/api/phone/media-stream`;

  connect.stream({
    url: wssUrl,
    track: 'both_tracks',
  });

  res.type('text/xml').send(response.toString());
});

export default router;
