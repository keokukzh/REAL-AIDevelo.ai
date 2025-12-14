import { Router } from 'express';
import { verifySupabaseAuth } from '../middleware/supabaseAuth';
import { getRecentCalls, getCalls, getCallBySid, testCall } from '../controllers/callsController';

const router = Router();

/**
 * GET /api/calls/recent
 * Fetch latest calls (backward compatibility)
 */
router.get('/recent', verifySupabaseAuth, getRecentCalls);

/**
 * GET /api/calls
 * Fetch calls with pagination and filters
 */
router.get('/', verifySupabaseAuth, getCalls);

/**
 * GET /api/calls/by-sid/:callSid
 * Get call details by Call SID
 */
router.get('/by-sid/:callSid', verifySupabaseAuth, getCallBySid);

/**
 * POST /api/calls/test
 * Place a test call (Twilio Calls API)
 */
router.post('/test', verifySupabaseAuth, testCall);

export default router;
