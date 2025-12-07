import { Router } from 'express';
import { createAgent, getAgents, getAgentById } from '../controllers/agentController';
import { validateRequest, validateParams } from '../middleware/validateRequest';
import { CreateAgentSchema, AgentIdParamSchema } from '../validators/agentValidators';

const router = Router();

/**
 * @swagger
 * /agents:
 *   post:
 *     summary: Create a new AI voice agent
 *     tags: [Agents]
 *     description: Creates a new voice agent with business profile and configuration. The agent will be registered with ElevenLabs and stored in the database.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAgentRequest'
 *           example:
 *             businessProfile:
 *               companyName: "Müller Sanitär AG"
 *               industry: "Handwerk / Sanitär"
 *               website: "https://www.mueller-sanitaer.ch"
 *               location:
 *                 country: "CH"
 *                 city: "Zürich"
 *               contact:
 *                 phone: "+41 44 123 45 67"
 *                 email: "info@mueller-sanitaer.ch"
 *               openingHours:
 *                 "Mon-Fri": "08:00-18:00"
 *                 "Sat": "09:00-12:00"
 *             config:
 *               primaryLocale: "de-CH"
 *               fallbackLocales: ["en-US"]
 *               elevenLabs:
 *                 voiceId: "21m00Tcm4TlvDq8ikWAM"
 *                 modelId: "eleven_turbo_v2_5"
 *     responses:
 *       201:
 *         description: Agent created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/VoiceAgent'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', validateRequest(CreateAgentSchema), createAgent);

/**
 * @swagger
 * /agents:
 *   get:
 *     summary: Get all agents
 *     tags: [Agents]
 *     description: Retrieves a list of all voice agents in the system
 *     responses:
 *       200:
 *         description: List of agents retrieved successfully
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
 *                     $ref: '#/components/schemas/VoiceAgent'
 *             example:
 *               success: true
 *               data:
 *                 - id: "123e4567-e89b-12d3-a456-426614174000"
 *                   elevenLabsAgentId: "agent_abc123"
 *                   businessProfile:
 *                     companyName: "Müller Sanitär AG"
 *                     industry: "Handwerk / Sanitär"
 *                   config:
 *                     primaryLocale: "de-CH"
 *                   status: "production_ready"
 *                   createdAt: "2024-01-15T10:30:00Z"
 *                   updatedAt: "2024-01-15T10:30:00Z"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', getAgents);

/**
 * @swagger
 * /agents/{id}:
 *   get:
 *     summary: Get agent by ID
 *     tags: [Agents]
 *     description: Retrieves a specific voice agent by its UUID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Agent UUID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Agent retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/VoiceAgent'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       400:
 *         description: Invalid UUID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id', validateParams(AgentIdParamSchema), getAgentById);

export default router;
