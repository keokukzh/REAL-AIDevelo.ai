import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { UnauthorizedError } from '../utils/errors';

// Extend Express Request to include Supabase user
export interface AuthenticatedRequest extends Request {
  supabaseUser?: {
    id: string;
    email?: string;
    supabaseUserId: string; // UUID from Supabase Auth
  };
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn('[SupabaseAuth] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY - auth middleware will fail');
}

// Service Role Client (server-only, bypasses RLS)
const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

/**
 * Middleware to verify Supabase JWT token and extract user info
 */
export const verifySupabaseAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  // Generate request ID for tracking
  const requestId = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    if (!supabaseAdmin) {
      console.error('[SupabaseAuth] Supabase not configured', { requestId });
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        reason: 'Supabase not configured',
        backendSha: process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || 'unknown',
        requestId,
      });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[SupabaseAuth] Missing or invalid authorization header', {
        requestId,
        hasHeader: !!authHeader,
        headerPrefix: authHeader?.substring(0, 10) || 'none',
      });
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        reason: 'Missing or invalid authorization header',
        backendSha: process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || 'unknown',
        requestId,
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error) {
      console.error('[SupabaseAuth] Token verification failed', {
        requestId,
        error: error.message,
        errorCode: (error as any).code,
        supabaseUrl: supabaseUrl ? new URL(supabaseUrl).hostname : 'not-set',
      });
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        reason: error.message || 'Invalid or expired token',
        backendSha: process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || 'unknown',
        requestId,
      });
    }

    if (!user) {
      console.error('[SupabaseAuth] No user returned from token verification', { requestId });
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        reason: 'Invalid or expired token',
        backendSha: process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || 'unknown',
        requestId,
      });
    }

    // Extract user info
    req.supabaseUser = {
      id: user.id,
      email: user.email,
      supabaseUserId: user.id, // Supabase Auth UUID
    };

    next();
  } catch (error) {
    console.error('[SupabaseAuth] Error verifying token:', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      reason: error instanceof Error ? error.message : 'Authentication failed',
      backendSha: process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || 'unknown',
      requestId,
    });
  }
};


