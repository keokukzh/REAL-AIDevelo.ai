import { Router, Request, Response } from 'express';
import { checkDbPreflight } from '../services/dbPreflight';

const router = Router();

/**
 * GET /api/db/preflight
 * NO AUTH REQUIRED - Public endpoint for schema verification
 * Returns preflight check result indicating if all required tables exist
 */
router.get('/preflight', async (req: Request, res: Response) => {
  try {
    const result = await checkDbPreflight();
    res.json(result);
  } catch (error) {
    console.error('[DbRoutes] Preflight check failed:', error);
    res.status(500).json({
      ok: false,
      missing: ['unknown_error'],
      warnings: ['Preflight check failed'],
      projectUrl: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
