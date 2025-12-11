import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../services/db';
import { defaultAgentService } from '../services/defaultAgentService';
import { BadRequestError } from '../utils/errors';
import { userRepository } from '../repositories/userRepository';

const router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user and auto-provision a default agent
 *     tags: [Auth]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *               userId:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created and default agent provisioned when applicable
 */
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, name, userId } = req.body || {};
    const normalizedEmail = typeof email === 'string' ? email.trim() : undefined;

    if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return next(new BadRequestError('Invalid email format'));
    }

    const useDatabase = userRepository.isDatabaseEnabled();
    const existing = normalizedEmail && useDatabase
      ? await userRepository.findByEmail(normalizedEmail)
      : normalizedEmail
        ? db.getUserByEmail(normalizedEmail)
        : undefined;

    const id = existing?.id || userId || uuidv4();

    const user = existing || (
      useDatabase
        ? await userRepository.upsertUser({ id, name: name || 'Neuer Benutzer', email: normalizedEmail })
        : db.saveUser({
            id,
            name: name || 'Neuer Benutzer',
            email: normalizedEmail,
            createdAt: new Date(),
          })
    );

    // Keep in-memory store in sync for dev/demo flows
    db.saveUser({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt || new Date(),
    });

    let defaultAgentId: string | undefined;
    try {
      if (!(await defaultAgentService.hasDefaultAgent(user.id))) {
        const agent = await defaultAgentService.provisionDefaultAgent(user.id, user.email);
        defaultAgentId = agent.id;
      }
    } catch (error) {
      console.warn('[Auth] Default agent provisioning failed (non-blocking):', error);
    }

    res.status(existing ? 200 : 201).json({
      success: true,
      data: {
        user,
        defaultAgentId,
      },
      message: defaultAgentId
        ? 'User registriert und Standard-Agent angelegt.'
        : 'User registriert.',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
