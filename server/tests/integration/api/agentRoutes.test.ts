import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../../../src/app';

describe('agentRoutes (integration)', () => {
  it('returns validation error for missing body', async () => {
    const res = await request(app).post('/api/v1/agents').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('creates agent with valid payload', async () => {
    const payload = {
      businessProfile: {
        companyName: 'Test Company AG',
        industry: 'Handwerk',
        location: {
          country: 'CH',
          city: 'Zürich',
        },
        contact: {
          email: 'test@example.com',
          phone: '+41 44 123 45 67',
        },
      },
      config: {
        primaryLocale: 'de-CH',
        fallbackLocales: ['en-US'],
        recordingConsent: false,
        elevenLabs: {
          voiceId: '21m00Tcm4TlvDq8ikWAM',
          modelId: 'eleven_turbo_v2_5',
        },
      },
    };

    const res = await request(app)
      .post('/api/v1/agents')
      .send(payload)
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('businessProfile');
    expect(res.body.data.businessProfile.companyName).toBe('Test Company AG');
    expect(res.body.data.status).toBe('creating'); // Initial status
  });

  it('returns agent by id', async () => {
    // First create an agent
    const createPayload = {
      businessProfile: {
        companyName: 'Test Agent Company',
        industry: 'Retail',
        location: {
          country: 'CH',
          city: 'Bern',
        },
        contact: {
          email: 'agent@example.com',
        },
      },
      config: {
        primaryLocale: 'de-CH',
        fallbackLocales: ['en-US'],
        recordingConsent: false,
        elevenLabs: {
          voiceId: '21m00Tcm4TlvDq8ikWAM',
          modelId: 'eleven_turbo_v2_5',
        },
      },
    };

    const createRes = await request(app)
      .post('/api/v1/agents')
      .send(createPayload)
      .set('Content-Type', 'application/json');

    expect(createRes.status).toBe(201);
    const agentId = createRes.body.data.id;

    // Then retrieve it
    const getRes = await request(app).get(`/api/v1/agents/${agentId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body).toHaveProperty('success', true);
    expect(getRes.body.data).toHaveProperty('id', agentId);
    expect(getRes.body.data.businessProfile.companyName).toBe('Test Agent Company');
  });
});

