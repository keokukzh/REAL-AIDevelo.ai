import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { listDocuments, uploadDocument, scrapeUrl, getJobStatus } from '../controllers/knowledgeController';
import { UnauthorizedError } from '../utils/errors';

const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 15 * 1024 * 1024 }, // 15MB safety limit
});

const knowledgeLimiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hour
	limit: 60,
	standardHeaders: true,
	legacyHeaders: false,
	message: 'Too many knowledge ingestion requests, please try again later.',
	keyGenerator: (req) => {
		const agentId = (req.body as any)?.agentId || (req.query as any)?.agentId;
		return agentId || req.ip;
	},
});

const requireKnowledgeApiKey = (req: Request, res: Response, next: NextFunction) => {
	const apiKey = process.env.KNOWLEDGE_API_KEY;
	if (!apiKey) return next(); // allow when no key configured

	const headerKey = req.headers['x-api-key'] || req.headers['x-knowledge-key'];
	const bearer = (req.headers.authorization || '').replace(/Bearer\s+/i, '');
	const provided = (headerKey as string) || bearer;

	if (!provided || provided !== apiKey) {
		return next(new UnauthorizedError('Invalid knowledge ingestion API key'));
	}

	next();
};

const router = Router();

/**
 * @swagger
 * /knowledge/documents:
 *   get:
 *     summary: List knowledge documents for an agent
 *     tags: [Knowledge]
 *     parameters:
 *       - in: query
 *         name: agentId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Documents retrieved
 */
router.get('/documents', knowledgeLimiter, requireKnowledgeApiKey, listDocuments);

/**
 * @swagger
 * /knowledge/upload:
 *   post:
 *     summary: Queue a document upload for ingestion
 *     tags: [Knowledge]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - agentId
 *               - file
 *             properties:
 *               agentId:
 *                 type: string
 *               title:
 *                 type: string
 *               locale:
 *                 type: string
 *               tags:
 *                 type: string
 *                 description: Comma-separated tags or JSON array string
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       202:
 *         description: Upload queued
 */
router.post('/upload', knowledgeLimiter, requireKnowledgeApiKey, upload.single('file'), uploadDocument);

/**
 * @swagger
 * /knowledge/scrape:
 *   post:
 *     summary: Queue a URL scrape for ingestion
 *     tags: [Knowledge]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - agentId
 *               - url
 *             properties:
 *               agentId:
 *                 type: string
 *               url:
 *                 type: string
 *               locale:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       202:
 *         description: Scrape queued
 */
router.post('/scrape', knowledgeLimiter, requireKnowledgeApiKey, scrapeUrl);

/**
 * @swagger
 * /knowledge/jobs/{jobId}:
 *   get:
 *     summary: Get knowledge ingest job status
 *     tags: [Knowledge]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job status
 */
router.get('/jobs/:jobId', knowledgeLimiter, requireKnowledgeApiKey, getJobStatus);

export default router;
