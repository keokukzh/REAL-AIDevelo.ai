import { Router, Response, NextFunction } from 'express';
import { BadRequestError, InternalServerError } from '../utils/errors';
import { AuthenticatedRequest } from '../middleware/supabaseAuth';
import { resolveLocationId } from '../utils/locationIdResolver';
import { ragContextBuilder } from '../voice-agent/rag/contextBuilder';
import { ragQueryService } from '../voice-agent/rag/query';
import { chatService } from '../voice-agent/llm/chat';
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

  /**
   * POST /api/dev/rag/test-agent
   * Dev-only endpoint to test Agent with RAG context
   * Only available when NODE_ENV !== 'production'
   */
  router.post('/test-agent', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.supabaseUser) {
        return next(new InternalServerError('User not authenticated'));
      }

      const { supabaseUserId, email } = req.supabaseUser;
      const { query, customerId } = req.body;

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
        console.log(`[DevRAGRoutes] Test agent: resolved locationId=${locationId} from source=${resolution.source}`);
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          error: 'locationId missing',
          message: error.message || 'Unable to resolve locationId',
        });
      }

      // Query RAG for context (if enabled)
      let ragContextText = '';
      let ragResultCount = 0;
      let ragInjectedChars = 0;
      let ragSources: any[] = [];

      if (voiceAgentConfig.rag.enabled && locationId) {
        try {
          const ragContext = await ragContextBuilder.buildRagContext({
            locationId,
            query,
            maxChunks: voiceAgentConfig.rag.maxChunks,
            maxChars: voiceAgentConfig.rag.maxChars,
            maxCharsPerChunk: voiceAgentConfig.rag.maxCharsPerChunk,
          });

          ragContextText = ragContext.contextText;
          ragResultCount = ragContext.resultCount;
          ragInjectedChars = ragContext.injectedChars;
          ragSources = ragContext.sources;

          console.log(`[DevRAGRoutes] RAG query="${query.substring(0, 50)}..." results=${ragResultCount} injectedChars=${ragInjectedChars} locationId=${locationId}`);
        } catch (error: any) {
          console.error('[DevRAGRoutes] RAG failed, continuing without context:', error.message);
          // Graceful fallback: continue without RAG context
        }
      }

      // Build prompt context
      const promptContext = ragQueryService.buildPromptContext(
        customerId || locationId,
        query,
        { chunks: [], query, customerId: locationId },
        {
          companyName: 'Test Company',
          industry: 'test',
        }
      );

      // Inject RAG context text if available
      if (ragContextText) {
        promptContext.ragContextText = ragContextText;
      }

      // Get LLM response
      const response = await chatService.chatComplete(query, {
        context: promptContext,
        tools: [],
      });

      res.json({
        success: true,
        data: {
          response: response.content,
          ragContext: {
            enabled: voiceAgentConfig.rag.enabled,
            resultCount: ragResultCount,
            injectedChars: ragInjectedChars,
            sources: ragSources,
            contextText: ragContextText,
          },
          locationId,
          query,
        },
      });
    } catch (error: any) {
      console.error('[DevRAGRoutes] Error in test-agent:', error);
      next(new InternalServerError(error.message || 'Unknown error'));
    }
  });
}

export default router;
