import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../../../src/app';

describe('FreeSWITCH routes', () => {
  it('GET /api/v1/freeswitch/did-routing returns dialplan-friendly plain text (never JSON)', async () => {
    const res = await request(app).get('/api/v1/freeswitch/did-routing?did=%2B41790000000');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
    // The endpoint must NOT return a JSON error body, because FreeSWITCH dialplan
    // assigns ${curl(url)} directly into a variable.
    expect(res.text.trim().startsWith('{')).toBe(false);
  });

  it('GET /api/v1/freeswitch/did-routing returns empty body when did missing', async () => {
    const res = await request(app).get('/api/v1/freeswitch/did-routing');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.text).toBe('');
  });
});
