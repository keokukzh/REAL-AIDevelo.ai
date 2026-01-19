import { Router } from 'express';
import { getDashboardOverview, testAgentCall } from '../controllers/defaultAgentController';
import { updateAgentConfig } from '../controllers/agentConfigController';
import { verifySupabaseAuth } from '../middleware/supabaseAuth';
import { generalLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * GET /api/dashboard/overview
 * Returns dashboard overview with agent, phone, calendar status and recent calls
 * Rate limited: 60 requests per minute per IP
 */
router.get('/overview', generalLimiter, verifySupabaseAuth, getDashboardOverview);

/**
 * PATCH /api/agent/config
 * Updates agent config for the authenticated user's location
 * Rate limited: 60 requests per minute per IP
 */
router.patch('/agent/config', generalLimiter, verifySupabaseAuth, updateAgentConfig);

/**
 * POST /api/agent/test-call
 * Initiate a test call for the agent
 * Rate limited: 60 requests per minute per IP
 */
router.post('/agent/test-call', generalLimiter, verifySupabaseAuth, testAgentCall);

/**
 * GET /api/dashboard/health
 * Health check endpoint for dashboard services
 */
router.get('/health', async (req, res) => {
  try {
    const { cacheService } = await import('../services/cacheService.js');
    const { supabaseAdmin } = await import('../services/supabaseDb.js');
    
    // Check cache service
    const cacheMetrics = cacheService.getMetrics();
    const cacheHealthy = cacheMetrics.errors < 100; // Allow some errors
    
    // Check database connection
    const { error: dbError } = await Promise.race([
      supabaseAdmin.from('users').select('id').limit(1),
      new Promise<{ error: Error }>((resolve) =>
        setTimeout(() => resolve({ error: new Error('timeout') }), 3000)
      ),
    ]);
    const dbHealthy = !dbError;
    
    const status = cacheHealthy && dbHealthy ? 'healthy' : 'degraded';
    const httpStatus = status === 'healthy' ? 200 : 503;
    
    res.status(httpStatus).json({
      ok: status === 'healthy',
      status,
      timestamp: new Date().toISOString(),
      services: {
        cache: {
          healthy: cacheHealthy,
          hitRate: cacheMetrics.hitRate,
          hits: cacheMetrics.hits,
          misses: cacheMetrics.misses,
        },
        database: {
          healthy: dbHealthy,
        },
      },
    });
  } catch (error: unknown) {
    // Log error but don't expose details in response
    console.error('[DashboardHealth] Health check failed:', error);
    res.status(503).json({
      ok: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

export default router;


