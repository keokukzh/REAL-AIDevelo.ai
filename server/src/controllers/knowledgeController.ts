import { Request, Response, NextFunction } from 'express';
import { knowledgeService } from '../services/knowledgeService';
import { BadRequestError, NotFoundError, InternalServerError } from '../utils/errors';
import { logger } from '../utils/logger';

const parseTags = (raw: unknown): string[] | undefined => {
  if (!raw) return undefined;
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as string[];
    } catch (_) {
      // Not JSON, fall back to comma-separated list
    }
    return raw.split(',').map((t) => t.trim()).filter(Boolean);
  }
  return undefined;
};

export const listDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { agentId } = req.query;
    
    // Check if RAG service is available (graceful degradation)
    let isHealthy = true;
    try {
      // Simple health check - try to list documents with timeout
      const healthCheckPromise = knowledgeService.listDocuments(agentId as string | undefined);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Service timeout')), 5000);
      });
      await Promise.race([healthCheckPromise, timeoutPromise]);
    } catch (error: any) {
      isHealthy = false;
      logger.warn('knowledge.listDocuments.health_check_failed', {
        error: error.message,
        agentId,
      });
    }

    if (!isHealthy) {
      // Return 503 with retry_after header for graceful degradation
      res.status(503).json({
        success: false,
        error: 'Knowledge base service is temporarily unavailable',
        retry_after: 30,
        data: [], // Return empty array instead of failing completely
      });
      return;
    }

    const docs = await knowledgeService.listDocuments(agentId as string | undefined);
    res.json({ success: true, data: docs });
  } catch (error: any) {
    logger.error('knowledge.listDocuments.error', error, { agentId: req.query.agentId });
    
    // Return 503 for service unavailable errors
    if (error.message?.includes('timeout') || error.message?.includes('unavailable')) {
      return res.status(503).json({
        success: false,
        error: 'Knowledge base service is temporarily unavailable',
        retry_after: 30,
      });
    }
    
    next(new InternalServerError('Failed to list knowledge documents'));
  }
};

export const uploadDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { agentId, title, locale } = req.body;
    const tags = parseTags(req.body?.tags);

    if (!agentId) {
      return next(new BadRequestError('agentId is required'));
    }
    if (!req.file) {
      return next(new BadRequestError('file is required'));
    }

    const doc = await knowledgeService.ingestUpload({ agentId, file: req.file, title, locale, tags });
    res.status(202).json({ success: true, data: doc, message: 'Upload queued for ingestion' });
  } catch (error: any) {
    next(new InternalServerError(error?.message || 'Failed to queue upload ingestion'));
  }
};

export const scrapeUrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { agentId, url, locale, title } = req.body;
    const tags = parseTags(req.body?.tags);
    if (!agentId || !url) {
      return next(new BadRequestError('agentId and url are required'));
    }
    const doc = await knowledgeService.ingestUrl({ agentId, url, locale, title, tags });
    res.status(202).json({ success: true, data: doc, message: 'Scrape queued for ingestion' });
  } catch (error: any) {
    next(new InternalServerError(error?.message || 'Failed to queue scrape ingestion'));
  }
};

export const getJobStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.params;
    const job = await knowledgeService.getJob(jobId);
    if (!job) {
      return next(new NotFoundError('Ingest job'));
    }
    res.json({ success: true, data: job });
  } catch (error) {
    next(new InternalServerError('Failed to fetch ingest job status'));
  }
};
