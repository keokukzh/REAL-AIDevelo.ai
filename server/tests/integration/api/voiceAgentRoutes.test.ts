import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../../../src/app';

describe('voiceAgentRoutes (integration)', () => {
  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/v1/voice-agent/query').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('customerId');
  });
});

