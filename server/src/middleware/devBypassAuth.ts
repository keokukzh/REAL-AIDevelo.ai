import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './supabaseAuth';
import { ensureUserRow, ensureOrgForUser, ensureDefaultLocation } from '../services/supabaseDb';

/**
 * Dev Bypass Auth Middleware
 * ONLY active when DEV_BYPASS_AUTH=true AND NODE_ENV !== 'production'
 * Sets req.supabaseUser to seed user without token verification
 * 
 * SECURITY: Hard-disabled in production (even if ENV is set)
 */
export const devBypassAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  // HARD SECURITY CHECK: Never allow in production
  if (process.env.NODE_ENV === 'production') {
    console.error('🚨 SECURITY: DEV_BYPASS_AUTH cannot be enabled in production!');
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      reason: 'Dev bypass auth is not allowed in production',
    });
  }

  // Check if bypass is enabled
  if (process.env.DEV_BYPASS_AUTH !== 'true') {
    return next(); // Skip bypass if not enabled, continue to normal auth
  }

  // Get seed user ID/email from ENV or use defaults
  const seedUserId = process.env.DEV_SEED_USER_ID || '00000000-0000-0000-0000-000000000001';
  const seedUserEmail = process.env.DEV_SEED_USER_EMAIL || 'dev@aidevelo.local';

  try {
    // Ensure seed user exists in DB (creates org + location if needed)
    const user = await ensureUserRow(seedUserId, seedUserEmail);
    const org = await ensureOrgForUser(seedUserId, seedUserEmail);
    const location = await ensureDefaultLocation(org.id);

    // Set user in request (matches AuthenticatedRequest interface)
    req.supabaseUser = {
      id: user.id,
      email: user.email || seedUserEmail,
      supabaseUserId: seedUserId,
    };

    // Log in dev mode only (not in production, but we already checked above)
    if (process.env.NODE_ENV !== 'production') {
      console.log('[DevBypassAuth] ✅ Using dev bypass auth:', {
        userId: user.id,
        email: user.email || seedUserEmail,
        orgId: org.id,
        locationId: location.id,
        path: req.path,
      });
    }
  } catch (error) {
    console.error('[DevBypassAuth] ❌ Error setting up seed user:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to setup dev bypass auth',
      reason: error instanceof Error ? error.message : 'Unknown error',
      backendSha: process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || 'unknown',
    });
  }

  // Continue to next middleware
  next();
};
