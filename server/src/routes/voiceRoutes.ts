import { Router } from 'express';
import { uploadVoiceClone, getVoiceClone } from '../controllers/voiceController';

const router = Router();

/**
 * @swagger
 * /voice/upload:
 *   post:
 *     summary: Upload audio and create voice clone
 *     tags: [Voice]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: audio
 *         type: file
 *         required: true
 *         description: Audio file for voice cloning
 *       - in: formData
 *         name: name
 *         type: string
 *         required: true
 *         description: Name for the voice clone
 *     responses:
 *       200:
 *         description: Voice clone created successfully
 */
router.post('/upload', uploadVoiceClone);

/**
 * @swagger
 * /voice/{voiceId}:
 *   get:
 *     summary: Get voice clone details
 *     tags: [Voice]
 *     parameters:
 *       - in: path
 *         name: voiceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Voice clone details retrieved successfully
 */
router.get('/:voiceId', getVoiceClone);

export default router;

