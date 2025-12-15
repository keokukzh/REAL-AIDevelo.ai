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
  });
});

