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
  try {
    if (!supabaseAdmin) {
      return next(new UnauthorizedError('Supabase not configured'));
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new UnauthorizedError('Missing or invalid authorization header'));
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return next(new UnauthorizedError('Invalid or expired token'));
    }

    // Extract user info
    req.supabaseUser = {
      id: user.id,
      email: user.email,
      supabaseUserId: user.id, // Supabase Auth UUID
    };

    next();
  } catch (error) {
    console.error('[SupabaseAuth] Error verifying token:', error);
    return next(new UnauthorizedError('Authentication failed'));
  }
};

