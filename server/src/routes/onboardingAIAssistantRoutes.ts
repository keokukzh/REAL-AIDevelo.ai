import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { onboardingAIService } from '../services/onboardingAIService';
import { BadRequestError } from '../utils/errors';

const router = Router();

/**
 * @swagger
 * /onboarding/ai-assistant:
 *   post:
 *     summary: Get AI assistant response for onboarding
 *     tags: [Onboarding]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *               currentTask:
 *                 type: string
 *               formData:
 *                 type: object
 *     responses:
 *       200:
 *         description: AI response generated successfully
 */
router.post('/ai-assistant', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, currentTask, formData } = req.body;

    if (!message || typeof message !== 'string') {
      return next(new BadRequestError('message is required'));
    }

    const response = await onboardingAIService.generateResponse({
      message,
      currentTask: currentTask || null,
      formData: formData || {},
    });

    res.json({
      success: true,
      data: {
        message: response,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

