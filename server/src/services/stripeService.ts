import Stripe from 'stripe';
import { supabaseAdmin } from './supabaseDb';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover' as any,
});

/**
 * Create Checkout Session für Subscription
 */
export async function createCheckoutSession(
  supabaseUserId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
) {
  // Hole User-Daten (aus der 'users' Tabelle mit supabase_user_id)
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, email, stripe_customer_id')
    .eq('supabase_user_id', supabaseUserId)
    .single();

  if (userError || !user) throw new Error('User not found');

  // Erstelle oder verwende existierenden Stripe-Customer
  let customerId = user.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email || undefined,
      metadata: { supabaseUserId, userId: user.id },
    });
    customerId = customer.id;

    // Speichere Customer-ID
    await supabaseAdmin.from('users').update({ stripe_customer_id: customerId }).eq('id', user.id);
  }

  // Erstelle Checkout-Session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      supabaseUserId,
      userId: user.id,
    },
  });

  return session;
}

/**
 * Create Customer Portal Session
 */
export async function createPortalSession(customerId: string, returnUrl: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

/**
 * Handle Webhook Events
 */
export async function handleWebhook(signature: string, payload: Buffer): Promise<void> {
  const event = stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!,
  );

  console.log('[StripeWebhook] Event:', event.type);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const subscriptionId = session.subscription as string;

      if (userId) {
        await supabaseAdmin.from('subscriptions').upsert(
          {
            user_id: userId,
            stripe_subscription_id: subscriptionId,
            status: 'active',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'stripe_subscription_id' },
        );
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: subscription.status,
          current_period_end: new Date(
            (subscription as any).current_period_end * 1000,
          ).toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('stripe_subscription_id', subscription.id);
      break;
    }

    default:
      console.log(`[StripeWebhook] Unhandled event type: ${event.type}`);
  }
}

export { stripe };
