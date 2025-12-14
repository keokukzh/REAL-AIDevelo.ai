import { Router, Request, Response } from 'express';

const router = Router();

// Get backend version from environment (Render sets RENDER_GIT_COMMIT)
const getBackendVersion = (): string => {
  return process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || 'unknown';
};

/**
 * GET /api/debug/env
 * Returns safe environment info (no secrets) for debugging
 * - SUPABASE_URL host and project ref
 * - Backend commit SHA
 */
router.get('/env', (req: Request, res: Response) => {
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const renderCommit = process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || 'unknown';
  
  // Extract project ref from Supabase URL (e.g., https://rckuwfcsqwwylffecwur.supabase.co)
  let supabaseHost = '';
  let supabaseProjectRef = '';
  
  if (supabaseUrl) {
    try {
      const url = new URL(supabaseUrl);
      supabaseHost = url.hostname;
      // Extract project ref (first part of hostname before .supabase.co)
      const parts = supabaseHost.split('.');
      if (parts.length > 0 && parts[0]) {
        supabaseProjectRef = parts[0];
      }
    } catch (error) {
      supabaseHost = 'invalid-url';
    }
  }
  
  // Add backend version header (no secrets)
  res.setHeader('x-aidevelo-backend-sha', getBackendVersion());
  
  res.json({
    supabase: {
      host: supabaseHost,
      projectRef: supabaseProjectRef,
      urlSet: !!process.env.SUPABASE_URL,
      serviceRoleKeySet: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    backend: {
      commitSha: renderCommit,
      nodeEnv: process.env.NODE_ENV || 'unknown',
    },
  });
});

export default router;

