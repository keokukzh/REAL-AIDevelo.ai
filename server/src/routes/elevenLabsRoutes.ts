import { Router } from 'express';
import { getVoices } from '../controllers/elevenLabsController';

const router = Router();

/**
 * @swagger
 * /elevenlabs/voices:
 *   get:
 *     summary: Get available voices from ElevenLabs
 *     tags: [ElevenLabs]
 *     description: Retrieves a list of available voices from ElevenLabs API, filtered for language suitability. Returns top 10 voices to avoid payload bloat.
 *     parameters:
 *       - in: query
 *         name: locale
 *         schema:
 *           type: string
 *           default: de
 *           example: de
 *         description: Locale code for filtering voices (currently not actively filtered, but parameter is accepted)
 *     responses:
 *       200:
 *         description: List of voices retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Voice'
 *             example:
 *               success: true
 *               data:
 *                 - voice_id: "21m00Tcm4TlvDq8ikWAM"
 *                   name: "Rachel"
 *                   category: "premade"
 *                 - voice_id: "EXAVITQu4vr4xnSDxMaL"
 *                   name: "Sarah"
 *                   category: "premade"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/voices', getVoices);

export default router;
