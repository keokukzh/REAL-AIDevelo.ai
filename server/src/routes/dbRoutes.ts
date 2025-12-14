import { Router, Request, Response } from 'express';
import { checkDbPreflight } from '../services/dbPreflight';

const router = Router();

// Get backend version from environment (Render sets RENDER_GIT_COMMIT)
const getBackendVersion = (): string => {
  return process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || 'unknown';
};

/**
 * GET /api/db/preflight
 * NO AUTH REQUIRED - Public endpoint for schema verification
 * Returns preflight check result indicating if all required tables exist
 */
router.get('/preflight', async (req: Request, res: Response) => {
  try {
    // Add backend version header (no secrets)
    res.setHeader('x-aidevelo-backend-sha', getBackendVersion());
    
    const result = await checkDbPreflight();
    res.json(result);
  } catch (error) {
    console.error('[DbRoutes] Preflight check failed:', error);
    // Add backend version header even on error
    res.setHeader('x-aidevelo-backend-sha', getBackendVersion());
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
