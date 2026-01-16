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

/**
 * GET /api/phone/forwarding-number
 * Return systems forwarding number
 */
router.get('/forwarding-number', verifySupabaseAuth, async (req, res, next) => {
  const { getForwardingNumber } = await import('../controllers/phoneController');
  return getForwardingNumber(req as any, res);
});

/**
 * POST /api/phone/register-personal
 * Register user's personal phone number
 */
router.post(
  '/register-personal',
  verifySupabaseAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { registerPersonalPhone } = await import('../controllers/phoneController');
    return registerPersonalPhone(req, res, next);
  },
);

/**
 * GET /api/phone/available-to-buy
 * List numbers available for purchase
 */
router.get(
  '/available-to-buy',
  verifySupabaseAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { listAvailableToBuy } = await import('../controllers/phoneController');
    return listAvailableToBuy(req, res, next);
  },
);

/**
 * POST /api/phone/purchase
 * Purchase a new virtual number
 */
router.post(
  '/purchase',
  verifySupabaseAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { purchaseNumber } = await import('../controllers/phoneController');
    return purchaseNumber(req, res, next);
  },
);

/**
 * POST /api/phone/test-personal
 * Test personal phone forwarding
 */
router.post(
  '/test-personal',
  verifySupabaseAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { testPersonalPhone } = await import('../controllers/phoneController');
    return testPersonalPhone(req, res, next);
  },
);

/**
 * POST /api/phone/test-register
 * Register a test phone number
 */
router.post(
  '/test-register',
  verifySupabaseAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.supabaseUser) return next(new InternalServerError('User not authenticated'));
      const { phone } = req.body;
      if (!phone) {
        return res.status(400).json({ success: false, error: 'phone is required' });
      }

      const { supabaseUserId } = req.supabaseUser;

      // Get user ID
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('supabase_user_id', supabaseUserId)
        .single();

      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      // Upsert test phone number
      const { error } = await supabaseAdmin.from('test_phone_numbers').upsert(
        {
          phone_number: phone,
          user_id: user.id,
          status: 'active',
          call_forwarding_enabled: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'phone_number' },
      );

      if (error) throw error;

      // Update user as test user
      await supabaseAdmin
        .from('users')
        .update({ is_test_user: true, phone_status: 'test_user' })
        .eq('id', user.id);

      res.json({
        success: true,
        message: 'Test phone registered successfully',
        data: { phone, status: 'active' },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/phone/test-status
 * Get current test phone status
 */
router.get(
  '/test-status',
  verifySupabaseAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.supabaseUser) return next(new InternalServerError('User not authenticated'));
      const { supabaseUserId } = req.supabaseUser;

      const { data: user } = await supabaseAdmin
        .from('users')
        .select('id, is_test_user, personal_phone_number')
        .eq('supabase_user_id', supabaseUserId)
        .single();

      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      const { data: testPhone } = await supabaseAdmin
        .from('test_phone_numbers')
        .select('phone_number, status, call_forwarding_enabled, created_at')
        .eq('user_id', user.id)
        .maybeSingle();

      res.json({
        success: true,
        data: {
          isTestUser: user.is_test_user || false,
          testPhone: testPhone
            ? {
                number: testPhone.phone_number,
                status: testPhone.status,
                forwardingEnabled: testPhone.call_forwarding_enabled,
                registeredAt: testPhone.created_at,
              }
            : null,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
