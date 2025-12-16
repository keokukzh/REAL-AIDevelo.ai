import { Router, Request, Response, NextFunction } from 'express';
import { InternalServerError, BadRequestError } from '../utils/errors';
import { config } from '../config/env';
import { supabaseAdmin } from '../services/supabaseDb';
import { ragContextBuilder } from '../voice-agent/rag/contextBuilder';
import { voiceAgentConfig } from '../voice-agent/config';
import axios from 'axios';

const router = Router();

/**
 * Dev-only endpoints for testing ElevenLabs integration
 * Only available when NODE_ENV !== 'production'
 */
if (process.env.NODE_ENV !== 'production') {
  /**
   * POST /api/dev/elevenlabs/test-connection
   * Test ElevenLabs connection with agent ID
   */
  router.post('/test-connection', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { agentId, locationId } = req.body;

      if (!config.isElevenLabsConfigured) {
        return res.status(400).json({
          success: false,
          error: 'ELEVENLABS_API_KEY not configured',
        });
      }

      let finalAgentId = agentId;
      let finalLocationId = locationId;

      // If locationId provided, try to get agent ID from DB
      if (finalLocationId && !finalAgentId) {
        const { data: agentConfig } = await supabaseAdmin
          .from('agent_configs')
          .select('eleven_agent_id')
          .eq('location_id', finalLocationId)
          .maybeSingle();

        if (agentConfig?.eleven_agent_id) {
          finalAgentId = agentConfig.eleven_agent_id;
        } else {
          finalAgentId = process.env.ELEVENLABS_AGENT_ID_DEFAULT || null;
        }
      }

      if (!finalAgentId) {
        return res.status(400).json({
          success: false,
          error: 'Agent ID required. Provide agentId or locationId with configured eleven_agent_id',
        });
      }

      // Test connection by checking agent exists
      const API_BASE = 'https://api.elevenlabs.io/v1';

      try {
        const agentResponse = await axios.get(`${API_BASE}/convai/agents/${finalAgentId}`, {
          headers: { 'xi-api-key': config.elevenLabsApiKey },
          timeout: 10000,
        });

        res.json({
          success: true,
          data: {
            agentId: finalAgentId,
            locationId: finalLocationId,
            agentExists: true,
            agentName: agentResponse.data.name,
            agentLanguage: agentResponse.data.language,
          },
        });
      } catch (error: any) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return res.status(404).json({
            success: false,
            error: 'Agent not found',
            agentId: finalAgentId,
            message: 'The specified ElevenLabs agent ID does not exist',
          });
        }
        throw error;
      }
    } catch (error: any) {
      console.error('[DevElevenLabsRoutes] Error in test-connection:', error);
      next(new InternalServerError(error.message || 'Unknown error'));
    }
  });

  /**
   * GET /api/dev/elevenlabs/list-agents
   * List all available ElevenLabs agents
   */
  router.get('/list-agents', async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!config.isElevenLabsConfigured) {
        return res.status(400).json({
          success: false,
          error: 'ELEVENLABS_API_KEY not configured',
        });
      }

      const API_BASE = 'https://api.elevenlabs.io/v1';

      try {
        const agentsResponse = await axios.get(`${API_BASE}/convai/agents`, {
          headers: { 'xi-api-key': config.elevenLabsApiKey },
          timeout: 10000,
        });

        const agents = agentsResponse.data?.agents || agentsResponse.data || [];
        
        // Also get current configuration
        const { data: agentConfig } = await supabaseAdmin
          .from('agent_configs')
          .select('id, location_id, eleven_agent_id')
          .limit(1)
          .maybeSingle();

        const defaultAgentId = process.env.ELEVENLABS_AGENT_ID_DEFAULT || 'agent_1601kcmqt4efe41bzwykaytm2yrj';

        res.json({
          success: true,
          data: {
            agents: Array.isArray(agents) ? agents : [],
            currentConfig: {
              databaseAgentId: agentConfig?.eleven_agent_id || null,
              defaultAgentId,
              locationId: agentConfig?.location_id || null,
            },
            recommendations: {
              useAgentId: agentConfig?.eleven_agent_id || defaultAgentId,
              agentExists: Array.isArray(agents) && agents.some((a: any) => 
                a.agent_id === (agentConfig?.eleven_agent_id || defaultAgentId)
              ),
            },
          },
        });
      } catch (error: any) {
        if (axios.isAxiosError(error)) {
          return res.status(error.response?.status || 500).json({
            success: false,
            error: 'Failed to list agents',
            message: error.response?.data?.detail?.message || error.message,
            status: error.response?.status,
          });
        }
        throw error;
      }
    } catch (error: any) {
      console.error('[DevElevenLabsRoutes] Error in list-agents:', error);
      next(new InternalServerError(error.message || 'Unknown error'));
    }
  });

  /**
   * POST /api/dev/elevenlabs/test-rag
   * Test RAG integration with ElevenLabs
   */
  router.post('/test-rag', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { locationId, query, agentId } = req.body;

      if (!locationId || !query) {
        return next(new BadRequestError('locationId and query are required'));
      }

      // Test RAG query
      let ragContextText = '';
      let ragResultCount = 0;
      let ragInjectedChars = 0;
      let ragSources: any[] = [];

      if (voiceAgentConfig.rag.enabled) {
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

          console.log(`[DevElevenLabsRoutes] RAG test query="${query.substring(0, 50)}..." results=${ragResultCount} injectedChars=${ragInjectedChars} locationId=${locationId}`);
        } catch (error: any) {
          console.error('[DevElevenLabsRoutes] RAG failed:', error.message);
          return res.status(500).json({
            success: false,
            error: 'RAG query failed',
            message: error.message,
          });
        }
      }

      // Test agent connection if agentId provided
      let agentTest = null;
      if (agentId && config.isElevenLabsConfigured) {
        try {
          const API_BASE = 'https://api.elevenlabs.io/v1';
          const agentResponse = await axios.get(`${API_BASE}/convai/agent/${agentId}`, {
            headers: { 'xi-api-key': config.elevenLabsApiKey },
            timeout: 10000,
          });
          agentTest = {
            agentId,
            exists: true,
            name: agentResponse.data.name,
          };
        } catch (error: any) {
          agentTest = {
            agentId,
            exists: false,
            error: axios.isAxiosError(error) ? error.message : 'Unknown error',
          };
        }
      }

      res.json({
        success: true,
        data: {
          locationId,
          query,
          rag: {
            enabled: voiceAgentConfig.rag.enabled,
            resultCount: ragResultCount,
            injectedChars: ragInjectedChars,
            sources: ragSources,
            contextText: ragContextText.substring(0, 500), // Limit for response
          },
          agent: agentTest,
        },
      });
    } catch (error: any) {
      console.error('[DevElevenLabsRoutes] Error in test-rag:', error);
      next(new InternalServerError(error.message || 'Unknown error'));
    }
  });
}

export default router;
