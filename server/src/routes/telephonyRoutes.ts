import { Router } from 'express';
import {
	getAvailableNumbers,
	assignNumber,
	assignNumberFromBody,
	updateNumberSettings,
	getNumberStatus,
	activateNumber,
	deactivateNumber,
	handleProviderWebhook,
} from '../controllers/telephonyController';

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
 * /telephony/assign:
 *   post:
 *     summary: Assign phone number to agent (body only)
 *     tags: [Telephony]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - agentId
 *               - phoneNumberId
 *             properties:
 *               agentId:
 *                 type: string
 *               phoneNumberId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Phone number assigned successfully
 */
router.post('/assign', assignNumberFromBody);

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

/**
 * @swagger
 * /telephony/agents/{agentId}/activate:
 *   post:
 *     summary: Activate an assigned phone number for an agent
 *     tags: [Telephony]
 *     parameters:
 *       - in: path
 *         name: agentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Phone number activated
 */
router.post('/agents/:agentId/activate', activateNumber);

/**
 * @swagger
 * /telephony/agents/{agentId}/deactivate:
 *   post:
 *     summary: Deactivate an assigned phone number for an agent
 *     tags: [Telephony]
 *     parameters:
 *       - in: path
 *         name: agentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Phone number deactivated
 */
router.post('/agents/:agentId/deactivate', deactivateNumber);

/**
 * @swagger
 * /telephony/webhooks/provider:
 *   post:
 *     summary: Provider webhook for call events/status updates
 *     tags: [Telephony]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook accepted
 */
router.post('/webhooks/provider', handleProviderWebhook);

export default router;

