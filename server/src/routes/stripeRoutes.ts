import express, { Router, Request, Response } from 'express';
import {
  createCheckoutSession,
  createPortalSession,
  handleWebhook,
} from '../services/stripeService';
import { verifySupabaseAuth, AuthenticatedRequest } from '../middleware/supabaseAuth';
import { supabaseAdmin } from '../services/supabaseDb';
import { config } from '../config/env';

const router = Router();

/**
 * POST /api/stripe/create-checkout-session
 */
router.post(
  '/create-checkout-session',
  verifySupabaseAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { priceId } = req.body;
      const supabaseUserId = req.supabaseUser?.supabaseUserId;

      if (!supabaseUserId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const session = await createCheckoutSession(
        supabaseUserId,
        priceId,
        `${config.frontendUrl}/dashboard/settings?success=true`,
        `${config.frontendUrl}/pricing?canceled=true`,
      );

      res.json({ sessionId: session.id, url: session.url });
    } catch (error: any) {
      console.error('[StripeRoutes] Checkout error:', error);
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * POST /api/stripe/create-portal-session
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

      const { data: user } = await supabaseAdmin
        .from('users')
        .select('stripe_customer_id')
        .eq('supabase_user_id', supabaseUserId)
        .single();

      if (!user?.stripe_customer_id) {
        return res.status(400).json({ error: 'No subscription found' });
      }

      const session = await createPortalSession(
        user.stripe_customer_id,
        `${config.frontendUrl}/dashboard/settings`,
      );

      res.json({ url: session.url });
    } catch (error: any) {
      console.error('[StripeRoutes] Portal error:', error);
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * POST /api/stripe/webhook
 * Stripe sends events here.
 * IMPORTANT: This route needs raw body for signature verification.
 */
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'] as string;

    try {
      await handleWebhook(signature, req.body);
      res.json({ received: true });
    } catch (error: any) {
      console.error('[StripeWebhook] Error:', error.message);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  },
);

export default router;
