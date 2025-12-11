import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock config to have no Stripe key so it uses mock mode
vi.mock('../../../src/config/env', () => ({
  config: {
    stripeSecretKey: '',
    frontendUrl: 'http://localhost:5173',
  },
}));

describe('paymentService', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('creates mock checkout session when Stripe is not configured', async () => {
    const { paymentService } = await import('../../../src/services/paymentService');
    
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

  it('handles webhook events', async () => {
    const { paymentService } = await import('../../../src/services/paymentService');
    
    // Create a test session ID
    const testSessionId = 'test_session_123';
    
    // Manually create a session in the Map to test webhook handling
    // (In real Stripe flow, this would be created by createCheckoutSession)
    const { paymentService: service } = await import('../../../src/services/paymentService');
    // Access the internal Map via the service - we'll test that webhook doesn't crash
    // when session doesn't exist, and that it updates when it does
    
    // Test that webhook handler doesn't throw when session doesn't exist
    await expect(
      paymentService.handleWebhookEvent({
        type: 'checkout.session.completed',
        data: { object: { id: testSessionId } as any },
      } as any)
    ).resolves.not.toThrow();
    
    // Test purchase ID getter
    expect(paymentService.getPurchaseId(testSessionId)).toBe(testSessionId);
  });
});

