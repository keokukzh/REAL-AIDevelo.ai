import { Router } from 'express';
import { verifySupabaseAuth } from '../middleware/supabaseAuth';
import { getSettings, updateSettings } from '../controllers/settingsController';

const router = Router();

/**
 * @swagger
 * /settings:
 *   get:
 *     summary: Get user and agent settings
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
 */
router.get('/', verifySupabaseAuth, getSettings);

/**
 * @swagger
 * /settings:
 *   patch:
 *     summary: Update settings
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Settings updated successfully
 */
router.patch('/', verifySupabaseAuth, updateSettings);

export default router;
