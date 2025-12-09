import { chatService } from '../llm/chat';
import { ragQueryService } from '../rag/query';
import { sessionStore } from './session';
import { OpenAIRealtimeClient, RealtimeCallbacks } from './openaiRealtime';
import { voiceAgentConfig } from '../config';
import axios from 'axios';
import { VoiceAgentSession } from '../types';

/**
 * Voice Pipeline Handlers
 * Handles ASR → LLM → TTS flow
 */

export interface VoicePipelineOptions {
  sessionId: string;
  customerId: string;
  agentId: string;
  companyName?: string;
  industry?: string;
}

export class VoicePipelineHandler {
  private realtimeClient: OpenAIRealtimeClient | null = null;
  private session: VoiceAgentSession | null = null;
  private options: VoicePipelineOptions;

  constructor(options: VoicePipelineOptions) {
    this.options = options;
  }

  /**
   * Initialize pipeline
   */
  async initialize(): Promise<void> {
    // Get or create session
    const existingSession = sessionStore.get(this.options.sessionId);
    if (!existingSession) {
      this.session = sessionStore.create(
        this.options.customerId,
        this.options.agentId,
        {
          companyName: this.options.companyName,
          industry: this.options.industry,
        }
      );
    } else {
      this.session = existingSession;
    }

    // Setup Realtime client callbacks
    const callbacks: RealtimeCallbacks = {
      onOpen: () => {
        console.log(`[VoicePipeline] Session ${this.options.sessionId} connected`);
      },
      onTranscript: async (text: string, isFinal: boolean) => {
        if (isFinal) {
          await this.handleTranscript(text);
        }
      },
      onAudio: async (audio: Buffer) => {
        // Audio from OpenAI Realtime (TTS) - forward to client
        // This would be handled by WebSocket to client
      },
      onError: (error: Error) => {
        console.error(`[VoicePipeline] Error: ${error.message}`);
        if (this.session) {
          sessionStore.update(this.options.sessionId, { status: 'error' });
        }
      },
      onClose: () => {
        console.log(`[VoicePipeline] Session ${this.options.sessionId} closed`);
        if (this.session) {
          sessionStore.end(this.options.sessionId);
        }
      },
    };

    this.realtimeClient = new OpenAIRealtimeClient(callbacks);
    await this.realtimeClient.connect();
  }

  /**
   * Handle transcript from ASR
   */
  private async handleTranscript(transcript: string): Promise<void> {
    if (!this.session) return;

    // Add to conversation history
    this.session.context?.conversationHistory.push({
      role: 'user',
      content: transcript,
      timestamp: new Date(),
    });

    // Query RAG
    const ragResult = await ragQueryService.query(
      this.options.customerId,
      transcript
    );

    // Build prompt context
    const conversationHistory = this.session.context?.conversationHistory
      .filter((h) => h.role !== 'system')
      .map((h) => ({ role: h.role as 'user' | 'assistant', content: h.content }));

    const promptContext = ragQueryService.buildPromptContext(
      this.options.customerId,
      transcript,
      ragResult,
      {
        companyName: this.options.companyName,
        industry: this.options.industry,
        conversationHistory,
      }
    );

    // Get LLM response
    const response = await chatService.chatComplete(transcript, {
      context: promptContext,
    });

    // Add assistant response to history
    this.session.context?.conversationHistory.push({
      role: 'assistant',
      content: response.content,
      timestamp: new Date(),
    });

    sessionStore.update(this.options.sessionId, {
      context: this.session.context,
    });

    // Generate TTS via ElevenLabs
    await this.generateTTS(response.content);
  }

  /**
   * Generate TTS audio via ElevenLabs
   */
  private async generateTTS(text: string): Promise<Buffer> {
    try {
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceAgentConfig.tts.defaultVoice}`,
        {
          text,
          model_id: 'eleven_turbo_v2_5',
        },
        {
          headers: {
            'xi-api-key': voiceAgentConfig.tts.elevenLabsApiKey,
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer',
        }
      );

      return Buffer.from(response.data);
    } catch (error) {
      console.error(`[VoicePipeline] TTS error: ${error}`);
      throw error;
    }
  }

  /**
   * Send audio input to ASR
   */
  sendAudio(audio: Buffer): void {
    if (this.realtimeClient) {
      this.realtimeClient.sendAudio(audio);
    }
  }

  /**
   * Send text input (for testing)
   */
  sendText(text: string): void {
    if (this.realtimeClient) {
      this.realtimeClient.sendText(text);
      this.realtimeClient.requestResponse();
    }
  }

  /**
   * Close pipeline
   */
  close(): void {
    if (this.realtimeClient) {
      this.realtimeClient.close();
    }
    if (this.session) {
      sessionStore.end(this.options.sessionId);
    }
  }
}

