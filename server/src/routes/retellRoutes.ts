import { Router } from 'express';
import { createSessionHandler, webhookHandler } from '../controllers/retellController';

const router = Router();

// POST /api/retell/session
router.post('/session', createSessionHandler);

// POST /api/retell/webhook
router.post('/webhook', webhookHandler);

export default router;
