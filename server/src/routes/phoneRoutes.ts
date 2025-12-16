import { Router } from 'express';
import { verifySupabaseAuth } from '../middleware/supabaseAuth';
import {
  listPhoneNumbers,
  connectPhoneNumber,
  getWebhookStatus,
  testWebhook,
} from '../controllers/phoneController';

const router = Router();

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

export default router;
