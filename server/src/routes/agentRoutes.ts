import { Router } from 'express';
import { createAgent, getAgents, getAgentById } from '../controllers/agentController';
import { validateRequest, validateParams } from '../middleware/validateRequest';
import { CreateAgentSchema, AgentIdParamSchema } from '../validators/agentValidators';

const router = Router();

router.post('/', validateRequest(CreateAgentSchema), createAgent);
router.get('/', getAgents);
router.get('/:id', validateParams(AgentIdParamSchema), getAgentById);

export default router;
