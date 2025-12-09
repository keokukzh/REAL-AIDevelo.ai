import { Router } from 'express';
import { getVoices, generateSpeech, testConnection } from '../controllers/elevenLabsController';

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

/**
 * @swagger
 * /elevenlabs/generate-speech:
 *   post:
 *     summary: Generate speech from text using ElevenLabs TTS
 *     tags: [ElevenLabs]
 *     description: Converts text to speech using the specified voice. Returns base64-encoded audio.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: Text to convert to speech
 *                 example: "Hallo! Ich bin dein neuer digitaler Zwilling."
 *               voiceId:
 *                 type: string
 *                 description: ElevenLabs voice ID (optional, defaults to Rachel)
 *                 example: "21m00Tcm4TlvDq8ikWAM"
 *               modelId:
 *                 type: string
 *                 description: ElevenLabs model ID (optional, defaults to eleven_multilingual_v2)
 *                 example: "eleven_multilingual_v2"
 *     responses:
 *       200:
 *         description: Speech generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     audioBase64:
 *                       type: string
 *                       description: Base64-encoded audio data
 *                     voiceId:
 *                       type: string
 *                     modelId:
 *                       type: string
 *                     textLength:
 *                       type: number
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/generate-speech', generateSpeech);

/**
 * @swagger
 * /elevenlabs/test:
 *   get:
 *     summary: Test ElevenLabs API connection
 *     tags: [ElevenLabs]
 *     description: Tests the connection to ElevenLabs API by validating the API key, fetching user info, and testing TTS generation
 *     responses:
 *       200:
 *         description: Connection test successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     apiKeyValid:
 *                       type: boolean
 *                     subscription:
 *                       type: object
 *                     voicesCount:
 *                       type: number
 *                     ttsTest:
 *                       type: object
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/test', testConnection);

export default router;
