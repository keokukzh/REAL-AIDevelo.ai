import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { verifySupabaseAuth } from '../../../src/middleware/supabaseAuth';
import phoneRoutes from '../../../src/routes/phoneRoutes';
import { errorHandler } from '../../../src/middleware/errorHandler';

// Mock Supabase auth middleware
vi.mock('../../../src/middleware/supabaseAuth', () => ({
  verifySupabaseAuth: vi.fn((req, res, next) => {
    // Mock authenticated user
    (req as any).supabaseUser = {
      supabaseUserId: 'test-user-id',
      email: 'test@example.com',
    };
    next();
  }),
}));

// Mock Twilio service
vi.mock('../../../src/services/twilioService', () => ({
  twilioService: {
    listPhoneNumbers: vi.fn().mockResolvedValue([
      {
        sid: 'PN123',
        phoneNumber: '+41791234567',
        capabilities: { voice: true, sms: false },
        friendlyName: 'Test Number',
      },
    ]),
    updateWebhooks: vi.fn().mockResolvedValue(undefined),
    getWebhookStatus: vi.fn().mockResolvedValue({
      voiceUrl: 'https://example.com/api/twilio/voice/inbound',
      statusCallback: 'https://example.com/api/twilio/voice/status',
    }),
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
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      single: vi.fn().mockResolvedValue({ data: { id: 'phone-123' }, error: null }),
    })),
  },
}));

describe('Phone Routes Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/phone', verifySupabaseAuth, phoneRoutes);
    app.use(errorHandler);
  });

  describe('GET /api/phone/numbers', () => {
    it('should return 401 if not authenticated', async () => {
      const unauthApp = express();
      unauthApp.use(express.json());
      unauthApp.use('/api/phone', phoneRoutes);
      unauthApp.use(errorHandler);

      const response = await request(unauthApp)
        .get('/api/phone/numbers?country=CH')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return list of phone numbers for authenticated user', async () => {
      const response = await request(app)
        .get('/api/phone/numbers?country=CH')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/phone/connect', () => {
    it('should return 400 if phoneNumberSid is missing', async () => {
      const response = await request(app)
        .post('/api/phone/connect')
        .send({ phoneNumber: '+41791234567' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 if phoneNumber is missing', async () => {
      const response = await request(app)
        .post('/api/phone/connect')
        .send({ phoneNumberSid: 'PN123' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should connect phone number successfully', async () => {
      const response = await request(app)
        .post('/api/phone/connect')
        .send({
          phoneNumberSid: 'PN123',
          phoneNumber: '+41791234567',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/phone/webhook-status', () => {
    it('should return webhook status for authenticated user', async () => {
      const response = await request(app)
        .get('/api/phone/webhook-status')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('configured');
      expect(response.body.data).toHaveProperty('expected');
      expect(response.body.data).toHaveProperty('matches');
    });
  });
});
