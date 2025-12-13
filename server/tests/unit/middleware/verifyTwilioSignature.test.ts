import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { computeTwilioSignature, verifyTwilioSignature } from '../../../src/middleware/verifyTwilioSignature';

describe('verifyTwilioSignature middleware', () => {
  const originalToken = process.env.TWILIO_AUTH_TOKEN;
  const originalPublicBaseUrl = process.env.PUBLIC_BASE_URL;

  beforeEach(() => {
    process.env.TWILIO_AUTH_TOKEN = 'test_twilio_token';
    process.env.PUBLIC_BASE_URL = '';
  });

  afterEach(() => {
    process.env.TWILIO_AUTH_TOKEN = originalToken;
    process.env.PUBLIC_BASE_URL = originalPublicBaseUrl;
  });

  function makeApp() {
    const app = express();
    app.use(express.urlencoded({ extended: false }));
    app.post('/twilio', verifyTwilioSignature, (req, res) => res.json({ ok: true, body: req.body }));
    return app;
  }

  it('accepts a valid signature', async () => {
    const app = makeApp();

    const url = 'https://example.com/twilio';
    const params = { Foo: 'Bar', baz: 'qux' };
    const signature = computeTwilioSignature('test_twilio_token', url, params);

    const res = await request(app)
      .post('/twilio')
      .set('Host', 'example.com')
      .set('X-Forwarded-Proto', 'https')
      .set('X-Twilio-Signature', signature)
      .type('form')
      .send(params);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('accepts a valid signature when PUBLIC_BASE_URL is set', async () => {
    process.env.PUBLIC_BASE_URL = 'https://public.example';

    const app = makeApp();

    const url = 'https://public.example/twilio';
    const params = { Foo: 'Bar' };
    const signature = computeTwilioSignature('test_twilio_token', url, params);

    const res = await request(app)
      .post('/twilio')
      .set('Host', 'localhost')
      .set('X-Twilio-Signature', signature)
      .type('form')
      .send(params);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('rejects a missing signature', async () => {
    const app = makeApp();

    const res = await request(app)
      .post('/twilio')
      .set('Host', 'example.com')
      .set('X-Forwarded-Proto', 'https')
      .type('form')
      .send({ Foo: 'Bar' });

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ success: false });
  });

  it('rejects an invalid signature', async () => {
    const app = makeApp();

    const res = await request(app)
      .post('/twilio')
      .set('Host', 'example.com')
      .set('X-Forwarded-Proto', 'https')
      .set('X-Twilio-Signature', 'invalid')
      .type('form')
      .send({ Foo: 'Bar' });

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ success: false });
  });

  it('skips verification in non-production when token is missing', async () => {
    process.env.TWILIO_AUTH_TOKEN = '';
    const app = makeApp();

    const res = await request(app)
      .post('/twilio')
      .set('Host', 'example.com')
      .set('X-Forwarded-Proto', 'https')
      .type('form')
      .send({ Foo: 'Bar' });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
