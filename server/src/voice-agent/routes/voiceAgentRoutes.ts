import { Router, Request, Response } from 'express';
import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { chatService } from '../llm/chat';
import { ragQueryService } from '../rag/query';
import { ragContextBuilder } from '../rag/contextBuilder';
import { documentIngestionService } from '../rag/ingest';
import { sessionStore } from '../voice/session';
import { VoicePipelineHandler } from '../voice/handlers';
import { ElevenLabsStreamingClient } from '../voice/elevenLabsStreaming';
import { createToolRegistry } from '../tools/toolRegistry';
import { db } from '../../services/db';
import { VoiceAgent } from '../../models/types';
import { resolveLocationId } from '../../utils/locationIdResolver';
import { BadRequestError } from '../../utils/errors';
import { voiceAgentConfig } from '../config';
import { twilioMediaStreamService, TwilioStreamMessage } from '../../services/twilioMediaStreamService';
import { elevenLabsBridgeService } from '../../services/elevenLabsBridgeService';
import { config } from '../../config/env';
import { supabaseAdmin } from '../../services/supabaseDb';

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
      console.log(`[VoiceAgentRoutes] Resolved locationId=${locationId} from source=${locationSource}`);
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

        console.log(`[RAG] query="${query.substring(0, 50)}..." results=${ragResultCount} injectedChars=${ragInjectedChars} locationId=${locationId}`);
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
      }
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
      console.warn('[VoiceAgentRoutes] /ingest endpoint: customerId is deprecated, use locationId instead');
    }

    const result = await documentIngestionService.ingestDocuments(
      targetLocationId, // Use locationId (or customerId as fallback)
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
 * POST /api/voice-agent/elevenlabs-stream-token
 * Get WebSocket URL for ElevenLabs Conversational API
 * Returns the WebSocket URL with API key embedded (secure for server-side use)
 */
router.post('/elevenlabs-stream-token', async (req: Request, res: Response) => {
  try {
    const { customerId, agentId, voiceId } = req.body;

    if (!customerId || !agentId) {
      return res.status(400).json({
        success: false,
        error: 'customerId and agentId are required',
      });
    }

    // Get ElevenLabs API key from config
    const apiKey = config.elevenLabsApiKey;

    if (!apiKey || !config.isElevenLabsConfigured) {
      return res.status(400).json({
        success: false,
        error: 'ElevenLabs API key not configured',
      });
    }

    // Resolve eleven_agent_id from agent_configs table
    // agentId might be agent_configs.id, so we need to get the eleven_agent_id
    let elevenAgentId: string | null = null;

    // Try to get eleven_agent_id from agent_configs table
    const { data: agentConfig } = await supabaseAdmin
      .from('agent_configs')
      .select('eleven_agent_id')
      .eq('id', agentId)
      .maybeSingle();

    if (agentConfig?.eleven_agent_id) {
      elevenAgentId = agentConfig.eleven_agent_id;
    } else {
      // If agentId is already an eleven_agent_id, use it directly
      // Otherwise, use default or fail
      const defaultAgentId = process.env.ELEVENLABS_AGENT_ID_DEFAULT || 'ogdlaxy0T9rCSVdH0VJM';
      elevenAgentId = defaultAgentId;
    }

    if (!elevenAgentId) {
      return res.status(400).json({
        success: false,
        error: 'ElevenLabs Agent ID not found. Please configure the Agent ID in Settings.',
      });
    }

    // Build WebSocket URL with API key
    // Note: For production, consider using a proxy WebSocket server to keep API key server-side
    const wsUrl = `wss://api.elevenlabs.io/v1/convai?api_key=${encodeURIComponent(apiKey)}`;

    console.log('[VoiceAgentRoutes] Generated stream token', {
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      elevenAgentId,
      customerId,
      wsUrlPrefix: wsUrl.substring(0, 50) + '...',
    });

    res.json({
      success: true,
      data: {
        wsUrl,
        agentId: elevenAgentId, // Return the actual ElevenLabs agent ID
        customerId,
        voiceId: voiceId || undefined,
        // Note: API key is embedded in URL for direct connection
        // In production, consider using a proxy WebSocket server
      },
    });
  } catch (error: any) {
    console.error('[VoiceAgentRoutes] Error generating stream token:', {
      error: error.message,
      stack: error.stack,
      customerId: req.body?.customerId,
      agentId: req.body?.agentId,
    });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate stream token',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

/**
 * Setup WebSocket server for real-time call handling and ElevenLabs streaming
 */
export function setupWebSocketServer(httpServer: HTTPServer): void {
  // WebSocket server for traditional call sessions
  const wss = new WebSocketServer({
    noServer: true,
  });

  // WebSocket server for ElevenLabs conversational API
  const elevenLabsWss = new WebSocketServer({
    noServer: true,
  });

  // WebSocket server for Twilio Media Streams (legacy /ws/twilio/stream)
  const twilioStreamWss = new WebSocketServer({
    noServer: true,
    verifyClient: (info, cb) => {
      try {
        const expectedToken = process.env.TWILIO_STREAM_TOKEN;
        if (!expectedToken) {
          cb(false, 500, 'TWILIO_STREAM_TOKEN not configured');
          return;
        }

        const reqUrl = info.req.url || '';
        const query = reqUrl.includes('?') ? reqUrl.slice(reqUrl.indexOf('?') + 1) : '';
        const params = new URLSearchParams(query);
        const token = params.get('token');

        if (!token || token !== expectedToken) {
          cb(false, 401, 'Unauthorized');
          return;
        }

        cb(true);
      } catch (error: any) {
        console.error(`[TwilioStream] verifyClient error: ${error?.message || error}`);
        cb(false, 400, 'Bad Request');
      }
    },
  });

  // WebSocket server for Twilio Media Streams (/api/twilio/media-stream)
  const twilioMediaStreamWss = new WebSocketServer({
    noServer: true,
    verifyClient: (info, cb) => {
      try {
        const expectedToken = process.env.TWILIO_STREAM_TOKEN;
        if (!expectedToken) {
          cb(false, 500, 'TWILIO_STREAM_TOKEN not configured');
          return;
        }

        const reqUrl = info.req.url || '';
        const query = reqUrl.includes('?') ? reqUrl.slice(reqUrl.indexOf('?') + 1) : '';
        const params = new URLSearchParams(query);
        const token = params.get('token');
        const callSid = params.get('callSid');

        if (!token || token !== expectedToken) {
          cb(false, 401, 'Unauthorized');
          return;
        }

        if (!callSid) {
          cb(false, 400, 'callSid parameter required');
          return;
        }

        cb(true);
      } catch (error: any) {
        console.error(`[TwilioMediaStream] verifyClient error: ${error?.message || error}`);
        cb(false, 400, 'Bad Request');
      }
    },
  });

  httpServer.on('upgrade', (req, socket, head) => {
    const pathname = (req.url || '').split('?')[0];

    if (pathname === '/api/voice-agent/call-session') {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
      return;
    }

    if (pathname === '/api/voice-agent/elevenlabs-stream') {
      elevenLabsWss.handleUpgrade(req, socket, head, (ws) => {
        elevenLabsWss.emit('connection', ws, req);
      });
      return;
    }

    if (pathname === '/ws/twilio/stream') {
      twilioStreamWss.handleUpgrade(req, socket, head, (ws) => {
        twilioStreamWss.emit('connection', ws, req);
      });
      return;
    }

    if (pathname === '/api/twilio/media-stream') {
      twilioMediaStreamWss.handleUpgrade(req, socket, head, (ws) => {
        twilioMediaStreamWss.emit('connection', ws, req);
      });
      return;
    }

    socket.destroy();
  });

  const activePipelines = new Map<string, VoicePipelineHandler>();
  const activeElevenLabsClients = new Map<string, ElevenLabsStreamingClient>();

  // Handle Twilio Media Streams (/api/twilio/media-stream)
  twilioMediaStreamWss.on('connection', (ws: WebSocket, req: any) => {
    // Extract callSid from query parameters
    let callSid: string | undefined;
    try {
      const reqUrl = typeof req?.url === 'string' ? req.url : '';
      const query = reqUrl.includes('?') ? reqUrl.slice(reqUrl.indexOf('?') + 1) : '';
      const params = new URLSearchParams(query);
      callSid = params.get('callSid') || undefined;
    } catch (error) {
      console.error('[TwilioMediaStream] Error parsing callSid:', error);
      ws.close(400, 'Invalid callSid');
      return;
    }

    if (!callSid) {
      console.error('[TwilioMediaStream] Missing callSid parameter');
      ws.close(400, 'callSid parameter required');
      return;
    }

    // Create session
    const session = twilioMediaStreamService.createSession(callSid, ws);

    // Handle messages
    ws.on('message', (data: any) => {
      try {
        const text = typeof data === 'string' ? data : (data as Buffer).toString('utf8');
        const message: TwilioStreamMessage = JSON.parse(text);
        
        // Handle message in service
        twilioMediaStreamService.handleMessage(session, message);
        
        // Bridge integration
        if (message.event === 'start' && message.start) {
          // Extract phoneNumber from customParameters (sent via TwiML <Parameter>)
          const phoneNumber = message.start.customParameters?.to;
          if (phoneNumber) {
            session.phoneNumber = phoneNumber;
          }
          console.log(`[TwilioMediaStream] start event customParameters callSid=${callSid} to=${phoneNumber || 'none'}`);
          
          // Create bridge to ElevenLabs when stream starts
          // Bridge will try call_logs first, then fallback to phoneNumber from customParameters
          elevenLabsBridgeService.createBridge(callSid, session, phoneNumber).catch((error) => {
            console.error(`[TwilioMediaStream] Failed to create bridge callSid=${callSid}:`, error);
            // Close session if bridge creation fails
            twilioMediaStreamService.cleanupSession(callSid, 'Bridge creation failed');
          });
        } else if (message.event === 'media' && message.media?.payload && message.media.track === 'inbound') {
          // Forward inbound audio to ElevenLabs bridge
          elevenLabsBridgeService.handleTwilioAudioByCallSid(callSid, message.media.payload);
        } else if (message.event === 'stop') {
          // Close bridge when stream stops
          elevenLabsBridgeService.closeBridge(callSid, 'Twilio stream stopped');
        }
      } catch (error: any) {
        console.error(`[TwilioMediaStream] Error processing message callSid=${callSid}:`, error?.message || error);
      }
    });
  });

  // Handle Twilio Media Streams (legacy /ws/twilio/stream)
  twilioStreamWss.on('connection', (ws: WebSocket, req: any) => {
    let streamSid: string | undefined;
    try {
      const reqUrl = typeof req?.url === 'string' ? req.url : '';
      const query = reqUrl.includes('?') ? reqUrl.slice(reqUrl.indexOf('?') + 1) : '';
      const params = new URLSearchParams(query);
      streamSid = params.get('StreamSid') || undefined;
    } catch {
      streamSid = undefined;
    }

    let frames = 0;
    let bytes = 0;

    console.log(`[TwilioStream] connected${streamSid ? ` streamSid=${streamSid}` : ''}`);

    ws.on('message', (data: any) => {
      try {
        const text = typeof data === 'string' ? data : (data as Buffer).toString('utf8');
        const message = JSON.parse(text);

        const event = message?.event;
        if (event === 'start') {
          const startStreamSid = message?.start?.streamSid;
          const callSid = message?.start?.callSid;
          console.log(`[TwilioStream] start streamSid=${startStreamSid || 'unknown'} callSid=${callSid || 'unknown'}`);
          return;
        }

        if (event === 'media') {
          const payload = message?.media?.payload;
          if (typeof payload === 'string' && payload.length > 0) {
            const audio = Buffer.from(payload, 'base64');
            frames += 1;
            bytes += audio.length;
            if (frames === 1 || frames % 50 === 0) {
              console.log(`[TwilioStream] media frames=${frames} bytes=${bytes}`);
            }
          }
          return;
        }

        if (event === 'stop') {
          const stopStreamSid = message?.stop?.streamSid;
          console.log(`[TwilioStream] stop streamSid=${stopStreamSid || 'unknown'} frames=${frames} bytes=${bytes}`);
          ws.close();
          return;
        }

        console.log(`[TwilioStream] unknown event=${String(event)}`);
      } catch (error: any) {
        console.error(`[TwilioStream] error processing message: ${error?.message || error}`);
      }
    });

    ws.on('close', () => {
      console.log(`[TwilioStream] closed frames=${frames} bytes=${bytes}`);
    });
  });

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

  // Handle ElevenLabs conversational streaming
  elevenLabsWss.on('connection', async (ws: WebSocket, req: any) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const sessionId = url.searchParams.get('sessionId');
    const customerId = url.searchParams.get('customerId');
    const agentId = url.searchParams.get('agentId');
    const voiceId = url.searchParams.get('voiceId');

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

    // Create ElevenLabs streaming client
    const client = new ElevenLabsStreamingClient(
      {
        agentId,
        customerId,
        voiceId: voiceId || agent.config.elevenLabs?.voiceId,
        language: agent.config.primaryLocale || 'de',
      },
      {
        onOpen: () => {
          console.log(`[ElevenLabs] Streaming session opened: ${sessionId}`);
          ws.send(JSON.stringify({ type: 'connection_opened' }));
        },
        onAudioChunk: (audio: Buffer) => {
          // Send audio chunks to client as binary data
          ws.send(audio, { binary: true });
        },
        onTranscription: (text: string, isFinal: boolean) => {
          ws.send(JSON.stringify({
            type: 'transcription',
            text,
            isFinal,
          }));
        },
        onError: (error: Error) => {
          console.error(`[ElevenLabs] Error in session ${sessionId}:`, error);
          ws.send(JSON.stringify({
            type: 'error',
            error: error.message,
          }));
        },
        onClose: () => {
          console.log(`[ElevenLabs] Streaming session closed: ${sessionId}`);
          ws.close();
        },
      }
    );

    try {
      await client.connect();
      activeElevenLabsClients.set(sessionId, client);

      // Handle incoming messages from client
      ws.on('message', (data: any) => {
        try {
          if (typeof data === 'string') {
            // Text message (user input)
            const message = JSON.parse(data);
            if (message.type === 'user_message') {
              client.sendUserMessage(message.text);
            }
          } else {
            // Binary data (audio input)
            client.sendAudioInput(data as Buffer);
          }
        } catch (error: any) {
          console.error(`[ElevenLabs] Error processing message: ${error.message}`);
          ws.send(JSON.stringify({
            type: 'error',
            error: 'Failed to process message',
          }));
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        client.disconnect();
        activeElevenLabsClients.delete(sessionId);
      });
    } catch (error: any) {
      console.error(`[ElevenLabs] Failed to initialize streaming: ${error.message}`);
      ws.close(1011, 'Failed to initialize streaming');
    }
  });
}


export default router;


