import express, { Router, Response, NextFunction } from 'express';
import { verifySupabaseAuth, AuthenticatedRequest } from '../middleware/supabaseAuth';
import { supabaseAdmin as supabase } from '../services/supabaseDb';
import Stripe from 'stripe';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover' as any,
});

/**
 * Middleware to check if user is admin
 */
const requireAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const supabaseUserId = req.supabaseUser?.supabaseUserId;
    if (!supabaseUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('role')
      .eq('supabase_user_id', supabaseUserId)
      .single();

    if (error || user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    next();
  } catch (error) {
    console.error('[AdminMiddleware] Error checking admin role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/admin/stats
 * Get dashboard stats
 */
router.get(
  '/stats',
  verifySupabaseAuth,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Get subscription counts by plan
      const { data: subscriptions } = await supabase
        .from('user_subscriptions')
        .select('plan_id, status')
        .eq('status', 'active');

      const planCounts = {
        starter: 0,
        professional: 0,
        enterprise: 0,
      };

      subscriptions?.forEach((sub: any) => {
        const planId = sub.plan_id.toLowerCase();
        if (planId.includes('starter')) planCounts.starter++;
        else if (planId.includes('pro')) planCounts.professional++;
        else if (planId.includes('enterprise')) planCounts.enterprise++;
      });

      // Calculate MRR (Simplified using hardcoded prices from PricingPage)
      // Starter: 29 CHF, Pro: 99 CHF, Enterprise: 299 CHF
      const mrr =
        planCounts.starter * 29 + planCounts.professional * 99 + planCounts.enterprise * 299;

      // Get total users
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Get new users this month
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);

      const { count: newUsersThisMonth } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', firstDayOfMonth.toISOString());

      res.json({
        subscriptions: {
          active: subscriptions?.length || 0,
          byPlan: planCounts,
        },
        revenue: {
          mrr,
          currency: 'CHF',
        },
        users: {
          total: totalUsers || 0,
          newThisMonth: newUsersThisMonth || 0,
        },
      });
    } catch (error: any) {
      console.error('[AdminRoutes] Get stats error:', error);
      res.status(500).json({ error: error.message || 'Failed to get stats' });
    }
  },
);

/**
 * GET /api/admin/recent-subscriptions
 */
router.get(
  '/recent-subscriptions',
  verifySupabaseAuth,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data: subscriptions, error } = await supabase
        .from('user_subscriptions')
        .select(
          `
        *,
        user:user_id (
          email,
          full_name
        )
      `,
        )
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      res.json({ subscriptions });
    } catch (error: any) {
      console.error('[AdminRoutes] Get recent subscriptions error:', error);
      res.status(500).json({ error: error.message || 'Failed to get recent subscriptions' });
    }
  },
);

export default router;
