import { Router } from 'express';
import { getDashboardOverview } from '../controllers/defaultAgentController';
import { updateAgentConfig } from '../controllers/agentConfigController';
import { verifySupabaseAuth } from '../middleware/supabaseAuth';

const router = Router();

/**
 * GET /api/dashboard/overview
 * Returns dashboard overview with agent, phone, calendar status and recent calls
 */
router.get('/overview', verifySupabaseAuth, getDashboardOverview);

/**
 * PATCH /api/agent/config
 * Updates agent config for the authenticated user's location
 */
router.patch('/agent/config', verifySupabaseAuth, updateAgentConfig);

export default router;


