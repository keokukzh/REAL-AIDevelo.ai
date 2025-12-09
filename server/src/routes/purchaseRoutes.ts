import { Router } from 'express';
import { createPurchase, linkPurchaseToAgent, getPurchaseByAgentId } from '../controllers/purchaseController';

const router = Router();

/**
 * @swagger
 * /purchases:
 *   post:
 *     summary: Create a purchase record
 *     tags: [Purchases]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *               - planName
 *               - customerEmail
 *               - purchaseId
 *             properties:
 *               planId:
 *                 type: string
 *               planName:
 *                 type: string
 *               customerEmail:
 *                 type: string
 *               purchaseId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Purchase created successfully
 */
router.post('/', createPurchase);

/**
 * @swagger
 * /purchases/{purchaseId}/link:
 *   post:
 *     summary: Link purchase to agent
 *     tags: [Purchases]
 *     parameters:
 *       - in: path
 *         name: purchaseId
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
 *     responses:
 *       200:
 *         description: Purchase linked successfully
 */
router.post('/:purchaseId/link', linkPurchaseToAgent);

/**
 * @swagger
 * /purchases/agent/{agentId}:
 *   get:
 *     summary: Get purchase by agent ID
 *     tags: [Purchases]
 *     parameters:
 *       - in: path
 *         name: agentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Purchase retrieved successfully
 */
router.get('/agent/:agentId', getPurchaseByAgentId);

export default router;

