import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../../../src/app';

describe('agentRoutes (integration)', () => {
  it('returns validation error for missing body', async () => {
    const res = await request(app).post('/api/v1/agents').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

