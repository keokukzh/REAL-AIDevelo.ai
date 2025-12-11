import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../services/db';
import { defaultAgentService } from '../services/defaultAgentService';
import { BadRequestError, UnauthorizedError } from '../utils/errors';
import { userRepository } from '../repositories/userRepository';
import { generateTokens, verifyRefreshToken } from '../services/authService';
import { AuthPayload } from '../../shared/types/auth';
import { validateRequest } from '../middleware/validateRequest';
import { loginSchema, refreshSchema, registerSchema } from '../validators/authValidators';
import { sendSuccess } from '../utils/apiResponse';

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
router.post('/register', validateRequest(registerSchema), async (req: Request, res: Response, next: NextFunction) => {
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

    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: 'user',
    });

    const payload: AuthPayload = {
      user,
      tokens,
    };

    sendSuccess(
      res,
      {
        ...payload,
        defaultAgentId,
      },
      defaultAgentId
        ? 'User registriert und Standard-Agent angelegt.'
        : 'User registriert.',
      existing ? 200 : 201
    );
  } catch (error) {
    next(error);
  }
});

router.post('/login', validateRequest(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, name, userId } = req.body || {};
    const normalizedEmail = typeof email === 'string' ? email.trim() : undefined;

    if (!normalizedEmail) {
      return next(new BadRequestError('E-Mail ist erforderlich'));
    }

    const useDatabase = userRepository.isDatabaseEnabled();
    const existing = useDatabase
      ? await userRepository.findByEmail(normalizedEmail)
      : db.getUserByEmail(normalizedEmail);

    const id = existing?.id || userId || normalizedEmail;
    const user = existing || (
      useDatabase
        ? await userRepository.upsertUser({ id, name: name || 'Benutzer', email: normalizedEmail })
        : db.saveUser({
            id,
            name: name || 'Benutzer',
            email: normalizedEmail,
            createdAt: new Date(),
          })
    );

    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: 'user',
    });

    sendSuccess(
      res,
      {
        user,
        tokens,
      } satisfies AuthPayload,
      'Login erfolgreich'
    );
  } catch (error) {
    next(error);
  }
});

router.post('/refresh', validateRequest(refreshSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) {
      return next(new BadRequestError('Refresh Token ist erforderlich'));
    }

    const decoded = verifyRefreshToken(refreshToken);
    const useDatabase = userRepository.isDatabaseEnabled();
    const user = useDatabase
      ? await userRepository.findById(decoded.userId)
      : db.getUser(decoded.userId);

    if (!user) {
      return next(new UnauthorizedError('Unbekannter Benutzer'));
    }

    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: 'user',
    });

    sendSuccess(
      res,
      {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
      'Token aktualisiert'
    );
  } catch (error) {
    next(error);
  }
});

export default router;
