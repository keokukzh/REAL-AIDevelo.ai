import { Router } from 'express';
import { runAutomatedTest } from '../controllers/testController';
import { validateParams } from '../middleware/validateRequest';
import { z } from 'zod';

const router = Router();

const AgentIdParamSchema = z.object({
  agentId: z.string().uuid('Invalid agent ID format')
});

router.post('/:agentId/run', validateParams(AgentIdParamSchema), runAutomatedTest);

export default router;
