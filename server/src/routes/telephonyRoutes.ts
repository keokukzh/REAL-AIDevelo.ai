import { Router } from 'express';
import { getAvailableNumbers, assignNumber, updateNumberSettings, getNumberStatus } from '../controllers/telephonyController';

const router = Router();

/**
 * @swagger
 * /telephony/numbers:
 *   get:
 *     summary: Get available phone numbers
 *     tags: [Telephony]
 *     parameters:
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *           default: CH
 *       - in: query
 *         name: planId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Available phone numbers retrieved successfully
 */
router.get('/numbers', getAvailableNumbers);

/**
 * @swagger
 * /telephony/agents/{agentId}/assign:
 *   post:
 *     summary: Assign phone number to agent
 *     tags: [Telephony]
 *     parameters:
 *       - in: path
 *         name: agentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phoneNumberId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Phone number assigned successfully
 */
router.post('/agents/:agentId/assign', assignNumber);

/**
 * @swagger
 * /telephony/numbers/{phoneNumberId}/settings:
 *   patch:
 *     summary: Update phone number settings
 *     tags: [Telephony]
 *     parameters:
 *       - in: path
 *         name: phoneNumberId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - agentId
 *             properties:
 *               agentId:
 *                 type: string
 *               greetingMessage:
 *                 type: string
 *               voicemailEnabled:
 *                 type: boolean
 *               callRecordingEnabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Settings updated successfully
 */
router.patch('/numbers/:phoneNumberId/settings', updateNumberSettings);

/**
 * @swagger
 * /telephony/numbers/{phoneNumberId}/status:
 *   get:
 *     summary: Get phone number status
 *     tags: [Telephony]
 *     parameters:
 *       - in: path
 *         name: phoneNumberId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Phone number status retrieved successfully
 */
router.get('/numbers/:phoneNumberId/status', getNumberStatus);

export default router;

