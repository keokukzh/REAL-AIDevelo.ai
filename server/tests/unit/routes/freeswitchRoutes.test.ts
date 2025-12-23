import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

// Mock Supabase admin client used by freeswitchRoutes
vi.mock('../../../src/services/supabaseDb', () => {
  return {
    supabaseAdmin: {
      from: () => ({
        select: () => ({
          or: () => ({
            maybeSingle: async () => ({ data: { location_id: 'loc_123' } }),
          }),
        }),
      }),
    },
  };
});

import app from '../../../src/app';

describe('FreeSWITCH routes', () => {
  it('GET /api/v1/freeswitch/did-routing returns plain text location_id', async () => {
    const res = await request(app).get('/api/v1/freeswitch/did-routing?did=%2B41790000000');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.text).toBe('loc_123');
  });

  it('GET /api/v1/freeswitch/did-routing returns empty body when did missing', async () => {
    const res = await request(app).get('/api/v1/freeswitch/did-routing');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.text).toBe('');
  });
});
