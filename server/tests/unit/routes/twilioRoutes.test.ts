import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import app from '../../../src/app';
import { computeTwilioSignature } from '../../../src/middleware/verifyTwilioSignature';

describe('Twilio voice routes', () => {
  const originalToken = process.env.TWILIO_AUTH_TOKEN;

  beforeEach(() => {
    process.env.TWILIO_AUTH_TOKEN = 'test_twilio_token';
  });

  afterEach(() => {
    process.env.TWILIO_AUTH_TOKEN = originalToken;
  });

  it('POST /api/twilio/voice/inbound returns TwiML XML (with valid signature)', async () => {
    const url = 'https://example.com/api/twilio/voice/inbound';
    const params = { CallSid: 'CA123', From: '+41790000000' };
    const signature = computeTwilioSignature('test_twilio_token', url, params);

    const res = await request(app)
      .post('/api/twilio/voice/inbound')
      .set('Host', 'example.com')
      .set('X-Forwarded-Proto', 'https')
      .set('X-Twilio-Signature', signature)
      .type('form')
      .send(params);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/xml');
    expect(res.text).toContain('<Response>');
    expect(res.text).toContain('<Hangup');
  });

  it('rejects missing signature', async () => {
    const res = await request(app)
      .post('/api/twilio/voice/inbound')
      .set('Host', 'example.com')
      .set('X-Forwarded-Proto', 'https')
      .type('form')
      .send({ CallSid: 'CA123' });

    expect(res.status).toBe(403);
  });
});
