import { Router } from 'express';
import { runAutomatedTest } from '../controllers/testController';

const router = Router();

router.post('/:agentId/run', runAutomatedTest);

export default router;
