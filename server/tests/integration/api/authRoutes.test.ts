import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../../../src/app';

describe('authRoutes (integration)', () => {
  it('fails login without email', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ password: 'abc' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

