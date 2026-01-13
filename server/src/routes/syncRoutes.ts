import { Router } from 'express';
import { syncAgent, syncAllAgents, handleWebhookEvent } from '../services/syncService';
import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../utils/errors';

const router = Router();

/**
 * @swagger
 * /sync/agents/{agentId}:
 *   post:
 *     summary: Sync agent
 *     tags: [Sync]
 *     parameters:
 *       - in: path
 *         name: agentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Agent synchronized successfully
 */
router.post('/agents/:agentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { agentId } = req.params;
    const result = await syncAgent(agentId);

    if (result.success) {
      res.json({
        success: true,
        data: result,
      });
    } else {
      res.status(400).json({
        success: false,
        data: result,
      });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /sync/agents:
 *   post:
 *     summary: Sync all agents
 *     tags: [Sync]
 *     responses:
 *       200:
 *         description: All agents synchronized
 */
router.post('/agents', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const results = await syncAllAgents();
    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /sync/webhook:
 *   post:
 *     summary: Handle sync webhook
 *     tags: [Sync]
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 */
router.post('/webhook', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { event, timestamp } = req.body;

    if (!event || !timestamp) {
      return next(new BadRequestError('event and timestamp are required'));
    }

    const result = await handleWebhookEvent(req.body);

    res.json({
      success: result.success,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
