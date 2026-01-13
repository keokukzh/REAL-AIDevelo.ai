import { chatService } from '../llm/chat';
import { ragQueryService } from '../rag/query';
import { ragContextBuilder } from '../rag/contextBuilder';
import { sessionStore } from './session';
import { voiceAgentConfig } from '../config';
import { VoiceAgentSession } from '../types';
import { AzureTTS } from '../../services/AzureTTS';
import { DeepSeekLLM } from '../../services/DeepSeekLLM';

const tts = new AzureTTS();
const llm = new DeepSeekLLM();

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
      this.session = sessionStore.create(this.options.customerId, this.options.agentId, {
        companyName: this.options.companyName,
        industry: this.options.industry,
      });
    } else {
      this.session = existingSession;
    }

    console.log(`[VoicePipeline] Pipeline initialized for session: ${this.options.sessionId}`);
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

    // Query RAG (if enabled)
    let ragContextText = '';
    let ragResultCount = 0;
    let ragInjectedChars = 0;

    if (voiceAgentConfig.rag.enabled && this.options.customerId) {
      try {
        const ragContext = await ragContextBuilder.buildRagContext({
          locationId: this.options.customerId, // customerId is used as locationId here
          query: transcript,
          maxChunks: voiceAgentConfig.rag.maxChunks,
          maxChars: voiceAgentConfig.rag.maxChars,
          maxCharsPerChunk: voiceAgentConfig.rag.maxCharsPerChunk,
        });

        ragContextText = ragContext.contextText;
        ragResultCount = ragContext.resultCount;
        ragInjectedChars = ragContext.injectedChars;

        console.log(
          `[RAG] query="${transcript.substring(0, 50)}..." results=${ragResultCount} injectedChars=${ragInjectedChars} locationId=${this.options.customerId}`,
        );
      } catch (error: any) {
        console.error('[RAG] failed, continuing without context:', error.message);
      }
    }

    // Build prompt context
    const conversationHistory = this.session.context?.conversationHistory
      .filter((h) => h.role !== 'system')
      .map((h) => ({ role: h.role as 'user' | 'assistant', content: h.content }));

    const promptContext = ragQueryService.buildPromptContext(
      this.options.customerId,
      transcript,
      { chunks: [], query: transcript, customerId: this.options.customerId },
      {
        companyName: this.options.companyName,
        industry: this.options.industry,
        conversationHistory,
      },
    );

    if (ragContextText) {
      promptContext.ragContextText = ragContextText;
    }

    // Get LLM response using DeepSeek
    const messages: Array<{ role: string; content: string }> = [
      {
        role: 'system',
        content: (promptContext as any).systemPrompt || 'You are a helpful assistant.',
      },
      ...(conversationHistory || []),
      { role: 'user', content: transcript },
    ];
    const responseContent = await llm.chat(messages);

    // Add assistant response to history
    this.session.context?.conversationHistory.push({
      role: 'assistant',
      content: responseContent,
      timestamp: new Date(),
    });

    sessionStore.update(this.options.sessionId, {
      context: this.session.context,
    });

    // Generate TTS via Azure TTS
    await this.generateTTS(responseContent);
  }

  /**
   * Generate TTS audio via Azure TTS
   */
  private async generateTTS(text: string): Promise<Buffer> {
    try {
      return await tts.synthesize(text);
    } catch (error) {
      console.error(`[VoicePipeline] TTS error: ${error}`);
      throw error;
    }
  }

  /**
   * Send audio input to ASR
   */
  sendAudio(audio: Buffer): void {
    // This pipeline currently handles direct audio forwarding for traditional sessions
    // Real-time phone streams are handled via Azure STT in twilioMediaStream.ts
    console.warn('[VoicePipeline] sendAudio incoming - processing depends on session type');
  }

  /**
   * Send text input (for testing)
   */
  sendText(text: string): void {
    console.log(`[VoicePipeline] sendText: ${text}`);
    this.handleTranscript(text).catch((err) => {
      console.error('[VoicePipeline] Error handling text input:', err);
    });
  }

  /**
   * Close pipeline
   */
  close(): void {
    if (this.session) {
      sessionStore.end(this.options.sessionId);
    }
  }
}
