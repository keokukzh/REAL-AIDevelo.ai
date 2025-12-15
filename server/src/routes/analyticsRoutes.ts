import { Router } from 'express';
import { verifySupabaseAuth } from '../middleware/supabaseAuth';
import { getCallsSummary, getTopSources } from '../controllers/analyticsController';

const router = Router();

/**
 * GET /api/analytics/calls/summary
 * Get aggregated call statistics for a location
 */
router.get('/calls/summary', verifySupabaseAuth, getCallsSummary);

/**
 * GET /api/analytics/calls/top-sources
 * Get top RAG sources across all calls for a location
 */
router.get('/calls/top-sources', verifySupabaseAuth, getTopSources);

export default router;
