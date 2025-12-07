import { Router } from 'express';
import { createAgent, getAgents, getAgentById } from '../controllers/agentController';

const router = Router();

router.post('/', createAgent);
router.get('/', getAgents);
router.get('/:id', getAgentById);

export default router;
