import WebSocket from 'ws';
import { voiceAgentConfig } from '../config';
import { chatService } from '../llm/chat';
import { ragQueryService } from '../rag/query';

/**
 * ElevenLabs Conversational API Client
 * WebSocket-based real-time voice interaction with streaming audio output
 * https://elevenlabs.io/docs/api-reference/websocket
 */

export interface ElevenLabsStreamCallbacks {
  onAudioChunk?: (audio: Buffer) => void;
  onTranscription?: (text: string, isFinal: boolean) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
  onOpen?: () => void;
}

export interface ConversationConfig {
  agentId: string;
  customerId: string;
  voiceId?: string;
  model?: string;
  language?: string;
}

export class ElevenLabsStreamingClient {
  private ws: WebSocket | null = null;
  private apiKey: string;
  private callbacks: ElevenLabsStreamCallbacks;
  private config: ConversationConfig;
  private conversationId: string | null = null;
  private isConnected: boolean = false;

  constructor(config: ConversationConfig, callbacks: ElevenLabsStreamCallbacks) {
    this.apiKey = voiceAgentConfig.tts.elevenLabsApiKey;
    this.config = config;
    this.callbacks = callbacks;
  }

  /**
   * Connect to ElevenLabs Conversational WebSocket
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const voiceId = this.config.voiceId || voiceAgentConfig.tts.defaultVoice;
      const wsUrl = `wss://api.elevenlabs.io/v1/convai?api_key=${this.apiKey}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.on('open', () => {
        console.log('[ElevenLabs] WebSocket connected');
        this.isConnected = true;
        this.callbacks.onOpen?.();

        // Send initial configuration
        this.initializeConversation(voiceId);
        resolve();
      });

      this.ws.on('message', (data) => {
        this.handleMessage(data);
      });

      this.ws.on('error', (error) => {
        console.error('[ElevenLabs] WebSocket error:', error);
        this.callbacks.onError?.(error as Error);
        reject(error);
      });

      this.ws.on('close', () => {
        console.log('[ElevenLabs] WebSocket closed');
        this.isConnected = false;
        this.callbacks.onClose?.();
      });

      // Set timeout for connection
      const timeout = setTimeout(() => {
        if (!this.isConnected) {
          reject(new Error('ElevenLabs connection timeout'));
        }
      }, 10000);

      this.ws!.on('open', () => clearTimeout(timeout));
    });
  }

  /**
   * Initialize conversation with ElevenLabs
   */
  private initializeConversation(voiceId: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not ready');
    }

    const initMessage = {
      type: 'conversation_initiation_client_data',
      conversation_config: {
        agent_id: this.config.agentId,
        language: this.config.language || 'de',
        client_tool_result: null,
      },
    };

    this.ws.send(JSON.stringify(initMessage));
  }

  /**
   * Handle incoming messages from ElevenLabs
   */
  private handleMessage(data: WebSocket.Data): void {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'conversation_initiation_client_data':
          this.conversationId = message.conversation_id;
          console.log('[ElevenLabs] Conversation initiated:', this.conversationId);
          break;

        case 'audio_out':
          // Audio output from ElevenLabs (TTS response)
          if (message.audio_event?.audio_base64) {
            const audioBuffer = Buffer.from(message.audio_event.audio_base64, 'base64');
            this.callbacks.onAudioChunk?.(audioBuffer);
          }
          break;

        case 'user_transcript':
          // Transcription of user input
          const transcript = message.user_transcript?.user_input || '';
          const isFinal = message.user_transcript?.is_final || false;
          this.callbacks.onTranscription?.(transcript, isFinal);

          // If final transcript received, query LLM for response
          if (isFinal && transcript) {
            this.processUserInput(transcript);
          }
          break;

        case 'server_mid':
          // Server MID (message ID) acknowledgment
          console.log('[ElevenLabs] Message acknowledged:', message.mid);
          break;

        case 'client_mid':
          // Client MID confirmation
          console.log('[ElevenLabs] Client message received:', message.mid);
          break;

        default:
          console.debug('[ElevenLabs] Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('[ElevenLabs] Error parsing message:', error);
      this.callbacks.onError?.(error as Error);
    }
  }

  /**
   * Process user input and generate LLM response
   */
  private async processUserInput(userInput: string): Promise<void> {
    try {
      // Query RAG for context
      const ragResult = await ragQueryService.query(
        this.config.customerId,
        userInput
      );

      // Build prompt context
      const promptContext = ragQueryService.buildPromptContext(
        this.config.customerId,
        userInput,
        ragResult,
        {}
      );

      // Get LLM response
      const response = await chatService.chatComplete(userInput, {
        context: promptContext,
      });

      // Send response back to ElevenLabs for TTS
      this.sendUserMessage(response.content);
    } catch (error) {
      console.error('[ElevenLabs] Error processing user input:', error);
      this.callbacks.onError?.(error as Error);
    }
  }

  /**
   * Send text message to ElevenLabs for TTS
   */
  sendUserMessage(text: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not ready');
    }

    const message = {
      type: 'user_message',
      user_message: text,
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Send audio input to ElevenLabs (user speech as base64)
   */
  sendAudioInput(audioBuffer: Buffer): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not ready');
    }

    const audioBase64 = audioBuffer.toString('base64');
    const message = {
      type: 'audio_in',
      audio_in: audioBase64,
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Disconnect from ElevenLabs
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Check if client is connected
   */
  isReady(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }
}
