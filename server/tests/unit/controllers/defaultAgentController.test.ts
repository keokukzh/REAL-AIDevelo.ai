import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { getDashboardOverview } from '../../../src/controllers/defaultAgentController';
import { AuthenticatedRequest } from '../../../src/middleware/supabaseAuth';
import * as supabaseDb from '../../../src/services/supabaseDb';

// Mock dependencies
vi.mock('../../../src/services/supabaseDb');
vi.mock('../../../src/services/dbPreflight');

describe('defaultAgentController', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();

    mockReq = {
      supabaseUser: {
        supabaseUserId: 'test-user-id',
        email: 'test@example.com',
      },
      headers: {},
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();
  });

  describe('getDashboardOverview', () => {
    it('should return dashboard overview for authenticated user', async () => {
      // Mock successful data retrieval
      const mockUser = { id: 'user-id', email: 'test@example.com' };
      const mockOrg = { id: 'org-id', name: 'Test Org' };
      const mockLocation = { id: 'loc-id', name: 'Test Location', timezone: 'Europe/Zurich' };
      const mockAgentConfig = {
        id: 'agent-id',
        eleven_agent_id: 'eleven-id',
        setup_state: 'complete',
        persona_gender: 'female',
        persona_age_range: '30-40',
        goals_json: ['goal1'],
        services_json: {},
        business_type: 'restaurant',
      };

      vi.mocked(supabaseDb.ensureUserRow).mockResolvedValue(mockUser as any);
      vi.mocked(supabaseDb.ensureOrgForUser).mockResolvedValue(mockOrg as any);
      vi.mocked(supabaseDb.ensureDefaultLocation).mockResolvedValue(mockLocation as any);
      vi.mocked(supabaseDb.ensureAgentConfig).mockResolvedValue(mockAgentConfig as any);
      vi.mocked(supabaseDb.supabaseAdmin).mockReturnValue({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        }),
      } as any);

      await getDashboardOverview(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
      const responseCall = (mockRes.json as any).mock.calls[0][0];
      expect(responseCall.success).toBe(true);
      expect(responseCall.data).toHaveProperty('user');
      expect(responseCall.data).toHaveProperty('organization');
      expect(responseCall.data).toHaveProperty('location');
      expect(responseCall.data).toHaveProperty('agent_config');
      expect(responseCall.data).toHaveProperty('status');
    });

    it('should handle missing supabaseUser', async () => {
      mockReq.supabaseUser = undefined;

      await getDashboardOverview(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: expect.stringContaining('Unauthorized'),
          }),
        })
      );
    });

    it('should handle database errors', async () => {
      vi.mocked(supabaseDb.ensureUserRow).mockRejectedValue(
        new Error('Database connection failed')
      );

      await getDashboardOverview(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      // Should pass error to next() middleware
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle validation errors', async () => {
      const mockUser = { id: 'user-id', email: null };
      const mockOrg = { id: 'org-id', name: 'Test Org' };
      const mockLocation = { id: 'loc-id', name: 'Test Location', timezone: 'Europe/Zurich' };
      const mockAgentConfig = {
        id: 'agent-id',
        eleven_agent_id: null,
        setup_state: 'complete',
        persona_gender: null,
        persona_age_range: null,
        goals_json: [],
        services_json: null,
        business_type: null,
      };

      vi.mocked(supabaseDb.ensureUserRow).mockResolvedValue(mockUser as any);
      vi.mocked(supabaseDb.ensureOrgForUser).mockResolvedValue(mockOrg as any);
      vi.mocked(supabaseDb.ensureDefaultLocation).mockResolvedValue(mockLocation as any);
      vi.mocked(supabaseDb.ensureAgentConfig).mockResolvedValue(mockAgentConfig as any);
      vi.mocked(supabaseDb.supabaseAdmin).mockReturnValue({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        }),
      } as any);

      await getDashboardOverview(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      // Should handle validation and pass to next() if validation fails
      // The actual behavior depends on zod validation
      expect(mockNext).toHaveBeenCalled();
    });
  });
});

