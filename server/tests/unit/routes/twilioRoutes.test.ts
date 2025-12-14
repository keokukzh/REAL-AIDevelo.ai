import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import app from '../../../src/app';
import { computeTwilioSignature } from '../../../src/middleware/verifyTwilioSignature';

describe('Twilio voice routes', () => {
  const originalAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const originalStreamToken = process.env.TWILIO_STREAM_TOKEN;
  const originalPublicBaseUrl = process.env.PUBLIC_BASE_URL;

  beforeEach(() => {
    process.env.TWILIO_AUTH_TOKEN = 'test_twilio_token';
    process.env.TWILIO_STREAM_TOKEN = 'test_stream_token_123';
    process.env.PUBLIC_BASE_URL = 'https://example.com';
  });

  afterEach(() => {
    process.env.TWILIO_AUTH_TOKEN = originalAuthToken;
    process.env.TWILIO_STREAM_TOKEN = originalStreamToken;
    if (originalPublicBaseUrl) {
      process.env.PUBLIC_BASE_URL = originalPublicBaseUrl;
    } else {
      delete process.env.PUBLIC_BASE_URL;
    }
  });

  it('POST /api/twilio/voice/inbound returns TwiML XML with <Connect><Stream> (with valid signature)', async () => {
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
    expect(res.text).toContain('<Connect>');
    expect(res.text).toContain('<Stream');
    expect(res.text).toContain('/ws/twilio/stream');
    expect(res.text).toContain('token=');
    expect(res.text).not.toContain('<Hangup');
  });

  it('POST /api/twilio/voice/inbound returns 500 when TWILIO_STREAM_TOKEN is missing', async () => {
    const url = 'https://example.com/api/twilio/voice/inbound';
    const params = { CallSid: 'CA123', From: '+41790000000' };
    const signature = computeTwilioSignature('test_twilio_token', url, params);

    // Temporarily remove stream token
    const savedToken = process.env.TWILIO_STREAM_TOKEN;
    delete process.env.TWILIO_STREAM_TOKEN;

    const res = await request(app)
      .post('/api/twilio/voice/inbound')
      .set('Host', 'example.com')
      .set('X-Forwarded-Proto', 'https')
      .set('X-Twilio-Signature', signature)
      .type('form')
      .send(params);

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error', 'TWILIO_STREAM_TOKEN not configured');

    // Restore for other tests
    if (savedToken) {
      process.env.TWILIO_STREAM_TOKEN = savedToken;
    } else {
      process.env.TWILIO_STREAM_TOKEN = 'test_stream_token_123';
    }
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
