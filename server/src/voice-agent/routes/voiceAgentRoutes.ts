import { Router, Request, Response } from 'express';
import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { chatService } from '../llm/chat';
import { ragQueryService } from '../rag/query';
import { documentIngestionService } from '../rag/ingest';
import { sessionStore } from '../voice/session';
import { VoicePipelineHandler } from '../voice/handlers';
import { toolRegistry } from '../tools/toolRegistry';
import { db } from '../../services/db';
import { VoiceAgent } from '../../models/types';

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
    const agent = db.getAllAgents().find((a: VoiceAgent) => 
      a.businessProfile.contact.email === customerId || a.id === customerId
    );

    // Query RAG
    const ragResult = await ragQueryService.query(customerId, query);

    // Build prompt context
    const promptContext = ragQueryService.buildPromptContext(
      customerId,
      query,
      ragResult,
      {
        companyName: agent?.businessProfile.companyName,
        industry: agent?.businessProfile.industry,
        tools: toolRegistry.getToolDefinitions(),
      }
    );

    // Get LLM response
    const response = await chatService.chatComplete(query, {
      context: promptContext,
      tools: toolRegistry.getToolDefinitions().map((def) => ({
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
        ragContext: ragResult.chunks.map((c) => c.text),
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
 * Document ingestion endpoint
 */
router.post('/ingest', async (req: Request, res: Response) => {
  try {
    const { customerId, documents } = req.body;

    if (!customerId || !documents || !Array.isArray(documents)) {
      return res.status(400).json({
        success: false,
        error: 'customerId and documents array are required',
      });
    }

    const result = await documentIngestionService.ingestDocuments(
      customerId,
      documents
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
 * Setup WebSocket server for real-time call handling
 */
export function setupWebSocketServer(httpServer: HTTPServer): void {
  const wss = new WebSocketServer({
    server: httpServer,
    path: '/api/voice-agent/call-session',
  });

  const activePipelines = new Map<string, VoicePipelineHandler>();

  wss.on('connection', async (ws: WebSocket, req) => {
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


