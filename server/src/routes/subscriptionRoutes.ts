import express, { Router, Response } from 'express';
import Stripe from 'stripe';
import { supabaseAdmin as supabase } from '../services/supabaseDb';
import { verifySupabaseAuth, AuthenticatedRequest } from '../middleware/supabaseAuth';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover' as any,
});

/**
 * GET /api/subscription/current
 * Fetch current user subscription from DB and Stripe
 */
router.get('/current', verifySupabaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const supabaseUserId = req.supabaseUser?.supabaseUserId;
    if (!supabaseUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user record to get internal userId if needed,
    // but user_subscriptions is linked to auth.users (user_id UUID)
    // Actually, check if user_subscriptions user_id is the auth id (supabaseUserId)
    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', supabaseUserId)
      .single();

    if (error || !subscription) {
      return res.json({ subscription: null });
    }

    // Get Stripe subscription details for latest status/dates
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripe_subscription_id,
    );

    res.json({
      subscription: {
        ...subscription,
        current_period_start: new Date((stripeSubscription as any).current_period_start * 1000),
        current_period_end: new Date((stripeSubscription as any).current_period_end * 1000),
        cancel_at_period_end: stripeSubscription.cancel_at_period_end,
      },
    });
  } catch (error: any) {
    console.error('[SubscriptionRoutes] Get current error:', error);
    res.status(500).json({ error: error.message || 'Failed to get subscription' });
  }
});

/**
 * POST /api/subscription/create-portal-session
 */
router.post(
  '/create-portal-session',
  verifySupabaseAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const supabaseUserId = req.supabaseUser?.supabaseUserId;
      if (!supabaseUserId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', supabaseUserId)
        .single();

      if (!subscription?.stripe_customer_id) {
        return res.status(404).json({ error: 'No subscription found' });
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: subscription.stripe_customer_id,
        return_url: `${process.env.FRONTEND_URL}/dashboard/subscription`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error('[SubscriptionRoutes] Portal error:', error);
      res.status(500).json({ error: error.message || 'Failed to create portal session' });
    }
  },
);

/**
 * POST /api/subscription/cancel
 * Cancel at end of period
 */
router.post('/cancel', verifySupabaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const supabaseUserId = req.supabaseUser?.supabaseUserId;
    if (!supabaseUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', supabaseUserId)
      .eq('status', 'active')
      .single();

    if (!subscription) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    const updatedSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      { cancel_at_period_end: true },
    );

    res.json({ success: true, subscription: updatedSubscription });
  } catch (error: any) {
    console.error('[SubscriptionRoutes] Cancel error:', error);
    res.status(500).json({ error: error.message || 'Failed to cancel subscription' });
  }
});

/**
 * POST /api/subscription/reactivate
 * Reactivate subscription (remove cancel_at_period_end)
 */
router.post('/reactivate', verifySupabaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const supabaseUserId = req.supabaseUser?.supabaseUserId;
    if (!supabaseUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', supabaseUserId)
      .single();

    if (!subscription) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    const updatedSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      { cancel_at_period_end: false },
    );

    res.json({ success: true, subscription: updatedSubscription });
  } catch (error: any) {
    console.error('[SubscriptionRoutes] Reactivate error:', error);
    res.status(500).json({ error: error.message || 'Failed to reactivate subscription' });
  }
});

export default router;
