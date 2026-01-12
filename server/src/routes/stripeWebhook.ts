import express from 'express';
import Stripe from 'stripe';
import { supabaseAdmin as supabase } from '../services/supabaseDb';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover' as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature']!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
      break;

    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
      break;

    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.Invoice);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId;
  if (!userId) {
    console.error('No userId in subscription metadata');
    return;
  }

  const { error } = await supabase.from('user_subscriptions').upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      status: subscription.status,
      plan_id: subscription.items.data[0].price.id,
      current_period_start: new Date(
        (subscription as any).current_period_start * 1000,
      ).toISOString(),
      current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'stripe_subscription_id' },
  );

  if (error) {
    console.error('Error upserting subscription:', error);
  }
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error canceling subscription:', error);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log(`Payment succeeded for invoice ${invoice.id}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`Payment failed for invoice ${invoice.id}`);
}

export default router;
