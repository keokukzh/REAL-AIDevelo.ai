import { Router } from 'express';
import { syncAgentWithElevenLabs, syncAllAgents, handleElevenLabsWebhook } from '../services/syncService';
import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../utils/errors';

const router = Router();

/**
 * @swagger
 * /sync/agents/{agentId}:
 *   post:
 *     summary: Sync agent with ElevenLabs
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
    const result = await syncAgentWithElevenLabs(agentId);
    
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
 *     summary: Sync all agents with ElevenLabs
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
 *     summary: Handle ElevenLabs webhook
 *     tags: [Sync]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - event
 *               - timestamp
 *             properties:
 *               event:
 *                 type: string
 *               agent_id:
 *                 type: string
 *               phone_number_id:
 *                 type: string
 *               voice_id:
 *                 type: string
 *               data:
 *                 type: object
 *               timestamp:
 *                 type: string
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

    const result = await handleElevenLabsWebhook(req.body);
    
    res.json({
      success: result.success,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

