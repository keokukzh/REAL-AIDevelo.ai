import { Router } from 'express';
import { createPaymentSession, getPaymentSession, handleWebhook } from '../controllers/paymentController';
import express from 'express';

const router = Router();

/**
 * @swagger
 * /payments/create-session:
 *   post:
 *     summary: Create a payment checkout session
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *             properties:
 *               planId:
 *                 type: string
 *                 example: "business"
 *               customerEmail:
 *                 type: string
 *                 example: "customer@example.com"
 *     responses:
 *       200:
 *         description: Checkout session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessionId:
 *                       type: string
 *                     url:
 *                       type: string
 */
router.post('/create-session', createPaymentSession);

/**
 * @swagger
 * /payments/session/{sessionId}:
 *   get:
 *     summary: Get payment session details
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session details retrieved successfully
 */
router.get('/session/:sessionId', getPaymentSession);

/**
 * @swagger
 * /payments/webhook:
 *   post:
 *     summary: Stripe webhook endpoint
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 */
// Webhook endpoint needs raw body for signature verification
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

export default router;

