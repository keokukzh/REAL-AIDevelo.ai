import { Router, Request, Response, NextFunction } from 'express';
import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import axios from 'axios';
import { chatService } from '../llm/chat';
import { ragQueryService } from '../rag/query';
import { ragContextBuilder } from '../rag/contextBuilder';
import { documentIngestionService } from '../rag/ingest';
import { sessionStore } from '../voice/session';
import { VoicePipelineHandler } from '../voice/handlers';
import { createToolRegistry } from '../tools/toolRegistry';
import { db } from '../../services/db';
import { VoiceAgent } from '../../models/types';
import { resolveLocationId } from '../../utils/locationIdResolver';
import { BadRequestError } from '../../utils/errors';
import { voiceAgentConfig } from '../config';
import { config } from '../../config/env';
import { supabaseAdmin } from '../../services/supabaseDb';
import { verifySupabaseAuth, AuthenticatedRequest } from '../../middleware/supabaseAuth';
import { cacheService, CacheTTL } from '../../services/cacheService';

const router = Router();

/**
 * POST /api/voice-agent/query
 * Text query endpoint for webchat
 */
router.post('/query', async (req: Request, res: Response) => {
  try {
    const { customerId, query, sessionId } = req.body;

    if (!customerId || !query) {
      return res.status(400).json({
        success: false,
        error: 'customerId and query are required',
      });
    }

    // Get agent info
    const agent = db
      .getAllAgents()
      .find(
        (a: VoiceAgent) => a.businessProfile.contact.email === customerId || a.id === customerId,
      );

    // Resolve locationId from request context
    let locationId: string;
    let locationSource: string;
    try {
      const resolution = await resolveLocationId(req, {
        supabaseUserId: (req as any).supabaseUser?.supabaseUserId,
        email: (req as any).supabaseUser?.email,
      });
      locationId = resolution.locationId;
      locationSource = resolution.source;
      console.log(
        `[VoiceAgentRoutes] Resolved locationId=${locationId} from source=${locationSource}`,
      );
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: 'locationId missing',
        message: error.message || 'Unable to resolve locationId',
      });
    }

    // Query RAG using locationId (if enabled)
    let ragContextText = '';
    let ragResultCount = 0;
    let ragInjectedChars = 0;

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

        console.log(
          `[RAG] query="${query.substring(0, 50)}..." results=${ragResultCount} injectedChars=${ragInjectedChars} locationId=${locationId}`,
        );
      } catch (error: any) {
        console.error('[RAG] failed, continuing without context:', error.message);
        // Graceful fallback: continue without RAG context
      }
    }

    const toolRegistry = createToolRegistry(locationId);

    // Build prompt context
    const promptContext = ragQueryService.buildPromptContext(
      customerId,
      query,
      { chunks: [], query, customerId: locationId }, // Empty RAG result for backward compatibility
      {
        companyName: agent?.businessProfile.companyName,
        industry: agent?.businessProfile.industry,
        tools: toolRegistry.getToolDefinitions(),
      },
    );

    // Inject RAG context text if available
    if (ragContextText) {
      promptContext.ragContextText = ragContextText;
    }

    // Get LLM response
    const response = await chatService.chatComplete(query, {
      context: promptContext,
      tools: toolRegistry.getToolDefinitions().map((def: any) => ({
        name: def.name,
        description: def.description,
        parameters: def.parameters,
      })),
    });

    // Execute tool calls if any
    if (response.toolCalls && response.toolCalls.length > 0) {
      for (const toolCall of response.toolCalls) {
        try {
          const result = await toolRegistry.execute(toolCall);
          toolCall.result = result;
        } catch (error: any) {
          toolCall.error = error.message;
        }
      }

      // If tools were called, get final response
      // In a more sophisticated implementation, we'd re-query LLM with tool results
    }

    res.json({
      success: true,
      data: {
        response: response.content,
        toolCalls: response.toolCalls,
        ragContext: ragContextText ? [ragContextText] : [],
        ragResultCount,
        ragInjectedChars,
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
 * POST /api/voice-agent/ingest
 * Document ingestion endpoint (LEGACY - use /api/rag/documents instead)
 *
 * @deprecated Use /api/rag/documents for new integrations
 * Supports both customerId (legacy) and locationId (new)
 */
router.post('/ingest', async (req: Request, res: Response) => {
  try {
    const { customerId, locationId, documents } = req.body;

    // Support both customerId (legacy) and locationId (new)
    const targetLocationId = locationId || customerId;

    if (!targetLocationId || !documents || !Array.isArray(documents)) {
      return res.status(400).json({
        success: false,
        error: 'locationId (or customerId for legacy) and documents array are required',
      });
    }

    // Log deprecation warning if customerId is used
    if (customerId && !locationId) {
      console.warn(
        '[VoiceAgentRoutes] /ingest endpoint: customerId is deprecated, use locationId instead',
      );
    }

    const result = await documentIngestionService.ingestDocuments(
      targetLocationId, // Use locationId (or customerId as fallback)
      documents,
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/voice-agent/session/:sessionId
 * Get session info
 */
router.get('/session/:sessionId', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = sessionStore.get(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    res.json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/voice-agent/call-session
 * Create new call session
 */
router.post('/call-session', (req: Request, res: Response) => {
  try {
    const { customerId, agentId, metadata } = req.body;

    if (!customerId || !agentId) {
      return res.status(400).json({
        success: false,
        error: 'customerId and agentId are required',
      });
    }

    const session = sessionStore.create(customerId, agentId, metadata);

    res.json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * DELETE /api/voice-agent/call-session/:sessionId
 * End call session
 */
router.delete('/call-session/:sessionId', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    sessionStore.end(sessionId);

    res.json({
      success: true,
      message: 'Session ended',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/voice-agent/webhook/call-completed
 * Twilio call completion webhook
 */
router.post('/webhook/call-completed', async (req: Request, res: Response) => {
  try {
    const { CallSid, CallStatus, CallDuration, From, To, RecordingUrl, Direction } = req.body;

    console.log(`[VoiceAgentWebhook] Call completed: ${CallSid} status=${CallStatus} to=${To}`);

    // Resolve locationId from phone number
    const { data: phoneData } = await supabaseAdmin
      .from('phone_numbers')
      .select('location_id')
      .or(`e164.eq.${To},e164.eq.${From}`) // Try both in case of outbound/inbound mixup
      .limit(1)
      .maybeSingle();

    const locationId = phoneData?.location_id;

    if (!locationId) {
      console.warn(
        `[VoiceAgentWebhook] Location not found for call: ${CallSid} (To: ${To}, From: ${From})`,
      );
    }

    // Save or Update Call-Log
    const callLogData = {
      call_sid: CallSid,
      location_id: locationId || null,
      from_e164: From,
      to_e164: To,
      outcome: CallStatus,
      duration_sec: parseInt(CallDuration || '0', 10),
      direction: Direction || 'inbound',
      ended_at: new Date().toISOString(),
      notes_json: {
        recording_url: RecordingUrl || null,
        completed_at: new Date().toISOString(),
      },
    };

    const { error: upsertError } = await supabaseAdmin
      .from('call_logs')
      .upsert(callLogData, { onConflict: 'call_sid' });

    if (upsertError) {
      console.error('[VoiceAgentWebhook] Error logging call:', upsertError);
      throw upsertError;
    }

    console.log('✅ Call logged successfully:', CallSid);
    res.status(200).send('OK');
  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Setup WebSocket server for real-time call handling
 */
export function setupWebSocketServer(httpServer: HTTPServer): void {
  // WebSocket server for traditional call sessions
  const wss = new WebSocketServer({
    noServer: true,
  });

  httpServer.on('upgrade', (req, socket, head) => {
    const pathname = (req.url || '').split('?')[0];

    if (pathname === '/api/voice-agent/call-session') {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
      return;
    }

    if (pathname === '/api/phone/media-stream') {
      const wssMiddleware = new WebSocketServer({ noServer: true });
      wssMiddleware.handleUpgrade(req, socket, head, (ws) => {
        // Dynamically import to avoid circular validation or load issues if file not fully ready
        const { twilioVoiceService } = require('../../services/twilioMediaStream');
        twilioVoiceService.handleStreamConnection(ws);
      });
      return;
    }

    socket.destroy();
  });

  const activePipelines = new Map<string, VoicePipelineHandler>();

  // Handle traditional call sessions
  wss.on('connection', async (ws: WebSocket, req: any) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const sessionId = url.searchParams.get('sessionId');
    const customerId = url.searchParams.get('customerId');
    const agentId = url.searchParams.get('agentId');

    if (!sessionId || !customerId || !agentId) {
      ws.close(1008, 'Missing required parameters');
      return;
    }

    // Get agent info
    const agent = db.getAgent(agentId);
    if (!agent) {
      ws.close(1008, 'Agent not found');
      return;
    }

    // Create pipeline handler
    const pipeline = new VoicePipelineHandler({
      sessionId,
      customerId,
      agentId,
      companyName: agent.businessProfile.companyName,
      industry: agent.businessProfile.industry,
    });

    try {
      await pipeline.initialize();
      activePipelines.set(sessionId, pipeline);

      // Handle incoming audio
      ws.on('message', async (data: Buffer) => {
        try {
          pipeline.sendAudio(data);
        } catch (error: any) {
          console.error(`[WebSocket] Error handling audio: ${error.message}`);
        }
      });

      // Handle close
      ws.on('close', () => {
        pipeline.close();
        activePipelines.delete(sessionId);
      });

      // Send initial greeting
      const greeting = `Grüezi, hier ist der virtuelle Assistent von ${agent.businessProfile.companyName}. Wie kann ich Ihnen helfen?`;
      pipeline.sendText(greeting);
    } catch (error: any) {
      console.error(`[WebSocket] Error initializing pipeline: ${error.message}`);
      ws.close(1011, 'Failed to initialize pipeline');
    }
  });
}

export default router;
