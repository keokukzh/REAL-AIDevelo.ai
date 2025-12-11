import { describe, expect, it } from 'vitest';
import { paymentService } from '../../../src/services/paymentService';

describe('paymentService', () => {
  it('creates mock checkout session when Stripe is not configured', async () => {
    const result = await paymentService.createCheckoutSession({
      planId: 'basic',
      planName: 'Basic',
      price: 10,
      currency: 'usd',
      customerEmail: 'test@example.com',
    });

    expect(result.sessionId).toMatch(/^mock_/);
    expect(result.url).toContain('payment-success');
  });

  it('updates payment session status on webhook events', async () => {
    const { sessionId } = await paymentService.createCheckoutSession({
      planId: 'pro',
      planName: 'Pro',
      price: 20,
      currency: 'usd',
    });

    await paymentService.handleWebhookEvent({
      type: 'checkout.session.completed',
      data: { object: { id: sessionId } as any },
    } as any);

    const session = paymentService.getPaymentSession(sessionId);
    expect(session?.status).toBe('completed');
    expect(paymentService.getPurchaseId(sessionId)).toBe(sessionId);
  });
});

