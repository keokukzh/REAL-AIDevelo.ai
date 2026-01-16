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
import {
  supabaseAdmin,
  ensureDefaultLocation,
  ensureUserRow,
  ensureOrgForUser,
} from '../services/supabaseDb';
import { twilioService } from '../services/twilioService';
import { config } from '../config/env';
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/supabaseAuth';
import { InternalServerError } from '../utils/errors';

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
 * GET /api/phone/status
 * Check Twilio connection status and return gateway health
 */
router.get(
  '/status',
  verifySupabaseAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.supabaseUser) {
        return next(new InternalServerError('User not authenticated'));
      }
      const { supabaseUserId, email } = req.supabaseUser;

      // Get user's organization and location
      await ensureUserRow(supabaseUserId, email);
      const org = await ensureOrgForUser(supabaseUserId, email);
      const location = await ensureDefaultLocation(org.id);

      // Check if Twilio credentials are configured
      const twilioConfigured = !!(process.env.TWILIO_ACCOUNT_SID && config.twilioAuthToken);

      // Check if a phone number is connected
      const { data: phoneData } = await supabaseAdmin
        .from('phone_numbers')
        .select('e164, status, twilio_number_sid')
        .eq('location_id', location.id)
        .eq('status', 'connected')
        .limit(1)
        .maybeSingle();

      const hasConnectedNumber = !!phoneData;

      // Check webhook configuration (optional)
      let webhookConfigured = false;
      if (twilioConfigured && phoneData?.twilio_number_sid) {
        try {
          const webhookStatus = await twilioService.getWebhookStatus(phoneData.twilio_number_sid);
          webhookConfigured =
            !!webhookStatus.voiceUrl &&
            webhookStatus.voiceUrl.includes('/api/twilio/voice/inbound');
        } catch (error) {
          console.error('[PhoneStatus] Error checking webhook:', error);
        }
      }

      // Determine overall status
      let gatewayStatus: 'OK' | 'WARN' | 'ERROR';
      if (twilioConfigured && hasConnectedNumber && webhookConfigured) {
        gatewayStatus = 'OK';
      } else if (twilioConfigured && hasConnectedNumber) {
        gatewayStatus = 'WARN'; // Number connected but webhook not configured
      } else {
        gatewayStatus = 'ERROR';
      }

      res.json({
        success: true,
        data: {
          twilioGateway: gatewayStatus,
          twilioConfigured,
          hasConnectedNumber,
          webhookConfigured,
          phoneNumber: phoneData?.e164 || null,
          details: {
            accountSid: twilioConfigured
              ? process.env.TWILIO_ACCOUNT_SID?.substring(0, 8) + '...'
              : null,
            publicBaseUrl: process.env.PUBLIC_BASE_URL || null,
            expectedWebhookUrl: process.env.PUBLIC_BASE_URL
              ? `${process.env.PUBLIC_BASE_URL}/api/twilio/voice/inbound`
              : null,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/phone/configure-webhook
 * Configure Twilio webhooks for a phone number
 */
router.post(
  '/configure-webhook',
  verifySupabaseAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { phoneNumberSid } = req.body;

      const publicBaseUrl = process.env.PUBLIC_BASE_URL;
      if (!publicBaseUrl) {
        return next(new InternalServerError('PUBLIC_BASE_URL not configured'));
      }

      const voiceUrl = `${publicBaseUrl}/api/twilio/voice/inbound`;
      const statusCallback = `${publicBaseUrl}/api/twilio/voice/status`;

      await twilioService.updateWebhooks(phoneNumberSid, voiceUrl, statusCallback);

      res.json({ success: true, message: 'Webhooks configured successfully' });
    } catch (error) {
      next(error);
    }
  },
);

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
