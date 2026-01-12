import express, { Router, Request, Response } from 'express';
import { handleWebhook } from '../services/stripeService';

const router = Router();

/**
 * POST /webhook
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
