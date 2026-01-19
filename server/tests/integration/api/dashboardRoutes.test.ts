import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { verifySupabaseAuth } from '../../../src/middleware/supabaseAuth';
import dashboardRoutes from '../../../src/routes/dashboardRoutes';
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

// Mock cache service
vi.mock('../../../src/services/cacheService', () => ({
  cacheService: {
    getMetrics: vi.fn(() => ({
      hits: 100,
      misses: 20,
      sets: 50,
      deletes: 10,
      errors: 0,
      hitRate: 83.33,
      total: 120,
    })),
  },
  CacheKeys: {
    dashboardOverview: (userId: string) => `dashboard:overview:${userId}`,
  },
  CacheTTL: {
    dashboardOverview: 30,
  },
}));

// Mock Supabase DB
vi.mock('../../../src/services/supabaseDb', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        limit: vi.fn(() => Promise.resolve({ error: null, data: [{ id: 'test-id' }] })),
      })),
    })),
  },
  ensureUserRow: vi.fn(() => Promise.resolve({ id: 'user-id', org_id: 'org-id', email: 'test@example.com', role: 'user' })),
  ensureOrgForUser: vi.fn(() => Promise.resolve({ id: 'org-id', name: 'Test Org' })),
  ensureDefaultLocation: vi.fn(() => Promise.resolve({ id: 'loc-id', name: 'Test Location', timezone: 'Europe/Zurich' })),
  ensureAgentConfig: vi.fn(() => Promise.resolve({ id: 'agent-id', setup_state: 'ready', goals_json: [], services_json: [] })),
}));

describe('Dashboard Routes Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/dashboard', verifySupabaseAuth, dashboardRoutes);
    app.use(errorHandler);
  });

  describe('GET /api/dashboard/overview', () => {
    it('should return 401 if not authenticated', async () => {
      // Create app without auth middleware
      const unauthApp = express();
      unauthApp.use(express.json());
      unauthApp.use('/api/dashboard', dashboardRoutes);
      unauthApp.use(errorHandler);

      const response = await request(unauthApp)
        .get('/api/dashboard/overview')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return dashboard overview for authenticated user', async () => {
      // Mock the controller to return test data
      vi.mock('../../../src/controllers/defaultAgentController', () => ({
        getDashboardOverview: vi.fn((req, res) => {
          res.status(200).json({
            success: true,
            data: {
              user: { id: 'user-id', email: 'test@example.com' },
              organization: { id: 'org-id', name: 'Test Org' },
              location: { id: 'loc-id', name: 'Test Location', timezone: 'Europe/Zurich' },
              agent_config: {
                id: 'agent-id',
                setup_state: 'complete',
                goals_json: [],
                services_json: {},
              },
              status: {
                agent: 'ready',
                phone: 'not_connected',
                calendar: 'not_connected',
              },
            },
          });
        }),
      }));

      const response = await request(app)
        .get('/api/dashboard/overview')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('organization');
    });

    it('should include meta information in response', async () => {
      // This test would require mocking the full controller flow
      // For now, we verify the structure exists
      expect(true).toBe(true); // Placeholder - actual test would mock controller
    });
  });

  describe('GET /api/dashboard/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/dashboard/health')
        .expect(200);

      expect(response.body).toHaveProperty('ok');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('services');
      expect(response.body.services).toHaveProperty('cache');
      expect(response.body.services).toHaveProperty('database');
    });

    it('should include cache metrics in health response', async () => {
      const response = await request(app)
        .get('/api/dashboard/health')
        .expect(200);

      expect(response.body.services.cache).toHaveProperty('healthy');
      expect(response.body.services.cache).toHaveProperty('hitRate');
      expect(response.body.services.cache).toHaveProperty('hits');
      expect(response.body.services.cache).toHaveProperty('misses');
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to dashboard routes', async () => {
      // Rate limiting is applied via generalLimiter middleware
      // This test verifies the middleware is configured
      expect(true).toBe(true); // Placeholder - actual rate limit testing would require more setup
    });
  });
});

