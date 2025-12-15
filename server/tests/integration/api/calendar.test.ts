import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { verifySupabaseAuth } from '../../../src/middleware/supabaseAuth';
import calendarRoutes from '../../../src/routes/calendarRoutes';
import { errorHandler } from '../../../src/middleware/errorHandler';

// Mock Supabase auth middleware
vi.mock('../../../src/middleware/supabaseAuth', () => ({
  verifySupabaseAuth: vi.fn((req, res, next) => {
    (req as any).supabaseUser = {
      supabaseUserId: 'test-user-id',
      email: 'test@example.com',
    };
    next();
  }),
}));

// Mock calendar service
vi.mock('../../../src/services/calendarService', () => ({
  calendarService: {
    getGoogleAuthUrl: vi.fn().mockReturnValue({
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=test',
      state: 'test-state',
    }),
    exchangeGoogleCode: vi.fn().mockResolvedValue({
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      expiresAt: Date.now() + 3600000,
      provider: 'google',
    }),
    storeToken: vi.fn().mockResolvedValue(undefined),
    refreshTokenIfNeeded: vi.fn().mockResolvedValue('test-access-token'),
  },
}));

// Mock Supabase DB service
vi.mock('../../../src/services/supabaseDb', () => ({
  ensureUserRow: vi.fn().mockResolvedValue({ id: 'user-123' }),
  ensureOrgForUser: vi.fn().mockResolvedValue({ id: 'org-123' }),
  ensureDefaultLocation: vi.fn().mockResolvedValue({ id: 'location-123' }),
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      single: vi.fn().mockResolvedValue({ data: { id: 'integration-123' }, error: null }),
    })),
  },
}));

// Mock OAuth state utilities
vi.mock('../../../src/utils/oauthState', () => ({
  createSignedState: vi.fn().mockReturnValue('test-state'),
  verifySignedState: vi.fn().mockReturnValue({ locationId: 'location-123', provider: 'google' }),
}));

describe('Calendar Routes Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/calendar', verifySupabaseAuth, calendarRoutes);
    app.use(errorHandler);
  });

  describe('GET /api/calendar/google/auth', () => {
    it('should return 401 if not authenticated', async () => {
      const unauthApp = express();
      unauthApp.use(express.json());
      unauthApp.use('/api/calendar', calendarRoutes);
      unauthApp.use(errorHandler);

      const response = await request(unauthApp)
        .get('/api/calendar/google/auth')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return OAuth URL for authenticated user', async () => {
      const response = await request(app)
        .get('/api/calendar/google/auth')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('authUrl');
      expect(response.body.data).toHaveProperty('state');
    });
  });

  describe('GET /api/calendar/google/callback', () => {
    it('should handle OAuth callback and store token', async () => {
      const response = await request(app)
        .get('/api/calendar/google/callback?code=test-code&state=test-state')
        .expect(200);

      // Should return HTML page that posts message to parent window
      expect(response.text).toContain('calendar-oauth-success');
    });

    it('should return 400 if code is missing', async () => {
      const response = await request(app)
        .get('/api/calendar/google/callback?state=test-state')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/calendar/google/disconnect', () => {
    it('should disconnect calendar for authenticated user', async () => {
      const response = await request(app)
        .delete('/api/calendar/google/disconnect')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/calendar/google/check-availability', () => {
    it('should check calendar availability', async () => {
      const response = await request(app)
        .post('/api/calendar/google/check-availability')
        .send({
          date: '2024-01-15',
          businessHours: { from: '09:00', to: '17:00' },
        })
        .expect(200);

      expect(response.body).toHaveProperty('success');
    });
  });

  describe('POST /api/calendar/google/create-appointment', () => {
    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/calendar/google/create-appointment')
        .send({
          summary: 'Test Appointment',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should create appointment with all required fields', async () => {
      const response = await request(app)
        .post('/api/calendar/google/create-appointment')
        .send({
          summary: 'Test Appointment',
          start: '2024-01-15T10:00:00Z',
          end: '2024-01-15T11:00:00Z',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success');
    });
  });
});
