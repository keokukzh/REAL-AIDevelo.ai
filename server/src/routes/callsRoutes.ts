import { Router } from 'express';
import { verifySupabaseAuth } from '../middleware/supabaseAuth';
import { getRecentCalls, testCall } from '../controllers/callsController';

const router = Router();

/**
 * GET /api/calls/recent
 * Fetch latest calls
 */
router.get('/recent', verifySupabaseAuth, getRecentCalls);

/**
 * POST /api/calls/test
 * Place a test call (Twilio Calls API)
 */
router.post('/test', verifySupabaseAuth, testCall);

export default router;
