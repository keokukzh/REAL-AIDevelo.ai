import { Router, Request, Response, NextFunction } from 'express';
import { getTestAgents, getTestAgentById } from '../services/testAgentsService';
import { sendSuccess } from '../utils/apiResponse';

const router = Router();

/**
 * GET /api/test-agents
 * Get all available test agents for preview mode
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agents = getTestAgents();
    sendSuccess(res, { agents }, 'Test agents retrieved successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/test-agents/:id
 * Get a specific test agent by ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const agent = getTestAgentById(id);
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Test agent not found',
      });
    }
    
    sendSuccess(res, { agent }, 'Test agent retrieved successfully');
  } catch (error) {
    next(error);
  }
});

export default router;

