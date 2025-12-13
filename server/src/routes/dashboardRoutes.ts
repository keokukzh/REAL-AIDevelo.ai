import { Router } from 'express';
import { getDashboardOverview } from '../controllers/defaultAgentController';
import { verifySupabaseAuth } from '../middleware/supabaseAuth';

const router = Router();

/**
 * GET /api/dashboard/overview
 * Returns dashboard overview with agent, phone, calendar status and recent calls
 */
router.get('/overview', verifySupabaseAuth, getDashboardOverview);

export default router;


