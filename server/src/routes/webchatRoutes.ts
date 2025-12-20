import { Router } from 'express';
import { handleWebchatMessage } from '../controllers/webchatController';
import { rateLimitMiddleware } from '../middleware/security';

const router = Router();

// Apply rate limiting (lighter than auth routes, but still protect against abuse)
const webchatRateLimit = rateLimitMiddleware({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute per IP
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/webchat/message
 * Public webchat endpoint for widget
 * No authentication required (uses widgetKey + origin validation)
 */
router.post('/message', webchatRateLimit, handleWebchatMessage);

export default router;
