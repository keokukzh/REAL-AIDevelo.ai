import { Router } from 'express';
import { verifySupabaseAuth } from '../middleware/supabaseAuth';
import {
  listPhoneNumbers,
  connectPhoneNumber,
  getWebhookStatus,
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

export default router;
