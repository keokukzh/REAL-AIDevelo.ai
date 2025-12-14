import { Router, Response, NextFunction } from 'express';
import { BadRequestError, InternalServerError } from '../utils/errors';
import { AuthenticatedRequest } from '../middleware/supabaseAuth';
import { resolveLocationId } from '../utils/locationIdResolver';
import { ragContextBuilder } from '../voice-agent/rag/contextBuilder';
import { voiceAgentConfig } from '../voice-agent/config';

const router = Router();

/**
 * POST /api/dev/rag/query
 * Dev-only endpoint to test RAG query and context building
 * Only available when NODE_ENV !== 'production'
 */
if (process.env.NODE_ENV !== 'production') {
  router.post('/query', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.supabaseUser) {
        return next(new InternalServerError('User not authenticated'));
      }

      const { supabaseUserId, email } = req.supabaseUser;
      const { query } = req.body;

      if (!query || typeof query !== 'string') {
        return next(new BadRequestError('query is required and must be a string'));
      }

      // Resolve locationId
      let locationId: string;
      try {
        const resolution = await resolveLocationId(req, {
          supabaseUserId,
          email,
        });
        locationId = resolution.locationId;
        console.log(`[DevRAGRoutes] Resolved locationId=${locationId} from source=${resolution.source}`);
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          error: 'locationId missing',
          message: error.message || 'Unable to resolve locationId',
        });
      }

      // Build RAG context
      const ragContext = await ragContextBuilder.buildRagContext({
        locationId,
        query,
        maxChunks: voiceAgentConfig.rag.maxChunks,
        maxChars: voiceAgentConfig.rag.maxChars,
        maxCharsPerChunk: voiceAgentConfig.rag.maxCharsPerChunk,
      });

      console.log(`[DevRAGRoutes] Query="${query}" results=${ragContext.resultCount} injectedChars=${ragContext.injectedChars} locationId=${locationId}`);

      res.json({
        success: true,
        data: {
          contextText: ragContext.contextText,
          sources: ragContext.sources,
          resultCount: ragContext.resultCount,
          injectedChars: ragContext.injectedChars,
          locationId,
          query,
        },
      });
    } catch (error: any) {
      console.error('[DevRAGRoutes] Error in query:', error);
      next(new InternalServerError(error.message || 'Unknown error'));
    }
  });
}

export default router;
