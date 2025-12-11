import { Router } from 'express';
import { createAgent, getAgents, getAgentById, activateAgent, syncAgent, createDefaultAgent } from '../controllers/agentController';
import { validateRequest, validateParams } from '../middleware/validateRequest';
import { CreateAgentSchema, AgentIdParamSchema } from '../validators/agentValidators';
import { requireAuth } from '../middleware/auth';
import { db } from '../services/db';

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
router.post('/', (req, res, next) => {
  console.log('[AgentRoutes] POST /agents received', {
    path: req.path,
    method: req.method,
    origin: req.headers.origin,
    contentType: req.headers['content-type'],
    bodySize: JSON.stringify(req.body).length
  });
  next();
}, validateRequest(CreateAgentSchema), createAgent);

/**
 * @swagger
 * /agents/default:
 *   post:
 *     summary: Create a default agent for a new user
 *     tags: [Agents]
 *     description: Auto-provisions a standard agent with default configuration. Used during user registration.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID to associate the agent with
 *               userEmail:
 *                 type: string
 *                 description: User email for personalization (optional)
 *           example:
 *             userId: "user_123abc"
 *             userEmail: "user@example.com"
 *     responses:
 *       201:
 *         description: Default agent created successfully
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
 *                 message:
 *                   type: string
 *       409:
 *         description: Default agent already exists for this user
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/default', createDefaultAgent);

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
router.get('/', requireAuth, getAgents);

/**
 * @swagger
 * /agents/templates:
 *   get:
 *     summary: Get available agent templates
 *     tags: [Agents]
 *     description: Retrieves a list of all available agent templates
 *     responses:
 *       200:
 *         description: Templates retrieved successfully
 */
router.get('/templates', async (req, res) => {
  try {
    // Return predefined templates
    // In production, these would be stored in a database
    const templates = [
      {
        id: 'dental-de',
        name: 'Zahnarzt (Deutsch)',
        description: 'Professioneller Voice Agent für Zahnarztpraxen',
        language: 'Deutsch',
        languageCode: 'de-CH',
        industry: 'Gesundheitswesen',
        useCase: ['Terminbuchung & Kalender', 'Lead-Qualifizierung'],
        icon: '🦷',
        systemPrompt: 'Du bist ein professioneller Assistent für eine Zahnarztpraxis...',
        voiceId: '21m00Tcm4TlvDq8ikWAM',
        modelId: 'eleven_turbo_v2_5',
        defaultSettings: {
          recordingConsent: true,
          openingHours: 'Mon-Fri: 08:00-18:00',
          goals: ['Termine buchen', 'Patienten informieren'],
        },
        tags: ['zahnarzt', 'gesundheit', 'deutsch'],
      },
      {
        id: 'hairdresser-de',
        name: 'Friseur (Deutsch)',
        description: 'Freundlicher Voice Agent für Friseursalons',
        language: 'Deutsch',
        languageCode: 'de-CH',
        industry: 'Dienstleistungen',
        useCase: ['Terminbuchung & Kalender', 'Bestellannahme'],
        icon: '✂️',
        systemPrompt: 'Du bist ein freundlicher Assistent für einen Friseursalon...',
        voiceId: '21m00Tcm4TlvDq8ikWAM',
        modelId: 'eleven_turbo_v2_5',
        defaultSettings: {
          recordingConsent: false,
          openingHours: 'Mon-Sat: 09:00-19:00',
          goals: ['Termine buchen', 'Kunden beraten'],
        },
        tags: ['friseur', 'dienstleistung', 'deutsch'],
      },
      {
        id: 'plumber-de',
        name: 'Sanitär (Deutsch)',
        description: 'Zuverlässiger Voice Agent für Sanitärbetriebe',
        language: 'Deutsch',
        languageCode: 'de-CH',
        industry: 'Handwerk',
        useCase: ['Terminbuchung & Kalender', 'Lead-Qualifizierung'],
        icon: '🔧',
        systemPrompt: 'Du bist ein professioneller Assistent für einen Sanitärbetrieb...',
        voiceId: '21m00Tcm4TlvDq8ikWAM',
        modelId: 'eleven_turbo_v2_5',
        defaultSettings: {
          recordingConsent: true,
          openingHours: 'Mon-Fri: 07:00-17:00',
          goals: ['Notfälle priorisieren', 'Termine koordinieren'],
        },
        tags: ['sanitär', 'handwerk', 'deutsch'],
      },
    ];

    res.json({
      success: true,
      data: templates,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

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
router.get('/:id', requireAuth, validateParams(AgentIdParamSchema), getAgentById);

/**
 * @swagger
 * /agents/{id}/activate:
 *   patch:
 *     summary: Activate an agent
 *     tags: [Agents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Agent activated successfully
 */
router.patch('/:id/activate', requireAuth, validateParams(AgentIdParamSchema), activateAgent);

/**
 * @swagger
 * /agents/{id}/sync:
 *   post:
 *     summary: Sync agent with ElevenLabs
 *     tags: [Agents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Agent synchronized successfully
 */
router.post('/:id/sync', requireAuth, validateParams(AgentIdParamSchema), syncAgent);

/**
 * @swagger
 * /agents/{id}:
 *   patch:
 *     summary: Update an agent
 *     tags: [Agents]
 *     description: Updates an existing agent's configuration
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Agent updated successfully
 */
router.patch('/:id', requireAuth, validateParams(AgentIdParamSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const agent = db.getAgentById(id);
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found',
      });
    }

    // Update agent in database
    const updatedAgent = db.updateAgent(id, updates);
    
    res.json({
      success: true,
      data: updatedAgent,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * @swagger
 * /agents/{id}/analytics:
 *   get:
 *     summary: Get agent analytics
 *     tags: [Agents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 */
router.get('/:id/analytics', requireAuth, validateParams(AgentIdParamSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    
    // Mock analytics data - in production, fetch from database
    res.json({
      success: true,
      data: {
        agentId: id,
        period: {
          start: startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end: endDate || new Date().toISOString(),
        },
        metrics: {
          totalCalls: 0,
          successfulCalls: 0,
          failedCalls: 0,
          avgDuration: 0,
          successRate: 0,
          callsByDay: [],
          callsByHour: [],
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /agents/{id}/calls:
 *   get:
 *     summary: Get call history for an agent
 *     tags: [Agents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Call history retrieved successfully
 */
router.get('/:id/calls', requireAuth, validateParams(AgentIdParamSchema), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock call history - in production, fetch from database
    res.json({
      success: true,
      data: [],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /agents/{id}/rag/documents:
 *   get:
 *     summary: Get RAG documents for an agent
 *     tags: [Agents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Documents retrieved successfully
 */
router.get('/:id/rag/documents', requireAuth, validateParams(AgentIdParamSchema), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock documents - in production, fetch from database/vector store
    res.json({
      success: true,
      data: [],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /agents/{id}/rag/documents:
 *   post:
 *     summary: Upload a document for RAG
 *     tags: [Agents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document uploaded successfully
 */
router.post('/:id/rag/documents', requireAuth, validateParams(AgentIdParamSchema), async (req, res) => {
  try {
    const { id } = req.params;
    
    // In production, handle file upload and process with RAG service
    res.json({
      success: true,
      data: {
        id: 'doc-' + Date.now(),
        agentId: id,
        name: req.body.name || 'Document',
        status: 'processing',
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /agents/{id}/rag/documents/{docId}:
 *   delete:
 *     summary: Delete a RAG document
 *     tags: [Agents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: docId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document deleted successfully
 */
router.delete('/:id/rag/documents/:docId', requireAuth, validateParams(AgentIdParamSchema), async (req, res) => {
  try {
    const { id, docId } = req.params;
    
    // In production, delete from database and vector store
    res.json({
      success: true,
      message: 'Document deleted',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
