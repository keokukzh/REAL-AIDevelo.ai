import { Router } from 'express';
import { runAutomatedTest } from '../controllers/testController';
import { validateParams } from '../middleware/validateRequest';
import { z } from 'zod';

const router = Router();

const AgentIdParamSchema = z.object({
  agentId: z.string().uuid('Invalid agent ID format')
});

/**
 * @swagger
 * /tests/{agentId}/run:
 *   post:
 *     summary: Run automated test suite for an agent
 *     tags: [Tests]
 *     description: |
 *       Triggers an automated test suite for a specific agent. The test suite evaluates:
 *       - Greeting responses
 *       - Opening hours inquiries
 *       - Appointment booking flows
 *       
 *       **Note:** Currently returns mock results. Full integration with ElevenLabs test API is planned.
 *     parameters:
 *       - in: path
 *         name: agentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Agent UUID to test
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Test completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TestResult'
 *             example:
 *               success: true
 *               data:
 *                 agentId: "123e4567-e89b-12d3-a456-426614174000"
 *                 timestamp: "2024-01-15T10:30:00Z"
 *                 score: 95
 *                 passed: true
 *                 details:
 *                   - case: "Greeting"
 *                     status: "passed"
 *                     latencyMs: 450
 *                   - case: "Opening Hours Inquiry"
 *                     status: "passed"
 *                     latencyMs: 600
 *                   - case: "Appointment Booking flow"
 *                     status: "passed"
 *                     latencyMs: 800
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       400:
 *         description: Invalid agent ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/:agentId/run', validateParams(AgentIdParamSchema), runAutomatedTest);

export default router;
