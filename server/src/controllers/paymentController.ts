import { Request, Response, NextFunction } from 'express';
import { paymentService } from '../services/paymentService';
import { InternalServerError, BadRequestError } from '../utils/errors';

// Pricing plans data (moved here to avoid cross-boundary imports)
const pricingPlans = [
  { id: 'starter', name: 'Starter', price: '89' },
  { id: 'business', name: 'Business', price: '179' },
  { id: 'premium', name: 'Premium', price: '349' },
  { id: 'enterprise', name: 'Enterprise', price: 'Auf Anfrage' },
];

export const createPaymentSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { planId, customerEmail } = req.body;

    if (!planId) {
      return next(new BadRequestError('planId is required'));
    }

    // Find plan in pricing data
    const plan = pricingPlans.find(p => p.id === planId);
    if (!plan) {
      return next(new BadRequestError('Invalid plan ID'));
    }

    // Skip payment for enterprise (handled via email)
    if (planId === 'enterprise') {
      return res.json({
        success: true,
        data: {
          sessionId: null,
          url: null,
          enterprise: true,
        },
      });
    }

    // Parse price (remove currency symbols, handle "Auf Anfrage")
    let price = 0;
    if (plan.price !== 'Auf Anfrage') {
      price = parseFloat(plan.price);
      if (isNaN(price)) {
        return next(new BadRequestError('Invalid plan price'));
      }
    }

    // Create checkout session
    const { sessionId, url } = await paymentService.createCheckoutSession({
      planId,
      planName: plan.name,
      price,
      currency: 'chf',
      customerEmail,
    });

    res.json({
      success: true,
      data: {
        sessionId,
        url,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return next(new BadRequestError('sessionId is required'));
    }

    // Get session from Stripe
    const stripeSession = await paymentService.getCheckoutSession(sessionId);
    if (!stripeSession) {
      return next(new InternalServerError('Session not found'));
    }

    // Get local payment session
    const paymentSession = paymentService.getPaymentSession(sessionId);

    res.json({
      success: true,
      data: {
        sessionId: stripeSession.id,
        status: stripeSession.payment_status,
        planId: stripeSession.metadata?.planId,
        planName: stripeSession.metadata?.planName,
        customerEmail: stripeSession.customer_email,
        paymentStatus: paymentSession?.status || 'pending',
        purchaseId: paymentService.getPurchaseId(sessionId),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const handleWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      return res.status(400).send('Missing signature or webhook secret');
    }

    // In production, verify webhook signature
    // For now, we'll handle the event directly
    const event = req.body;

    await paymentService.handleWebhookEvent(event);

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
};

