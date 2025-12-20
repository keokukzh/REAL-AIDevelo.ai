import { chatService } from '../../voice-agent/llm/chat';
import { ragContextBuilder } from '../../voice-agent/rag/contextBuilder';
import { ragQueryService } from '../../voice-agent/rag/query';
import { createToolRegistry } from '../../voice-agent/tools/toolRegistry';
import { voiceAgentConfig } from '../../voice-agent/config';
import { conversationRepository } from '../conversations/conversationRepository';
import { supabaseAdmin } from '../../services/supabaseDb';
import { logger, redact } from '../../utils/logger';
import { LLMResponse } from '../../voice-agent/types';

export interface AgentCoreOptions {
  locationId: string;
  channel: 'webchat' | 'whatsapp';
  externalUserId: string;
  text: string;
  externalMessageId?: string;
  metadata?: Record<string, any>;
}

export interface AgentCoreResponse {
  text: string;
  toolCalls?: Array<{
    name: string;
    arguments: any;
    result?: any;
    error?: string;
  }>;
}

/**
 * Central Agent Core
 * Handles all text-based channels (webchat, whatsapp) with unified RAG + Tools + Prompt logic
 * Same "brain" as voice agent, but optimized for text channels
 */
export class AgentCore {
  /**
   * Handle a message from any text channel
   */
  async handleMessage(options: AgentCoreOptions): Promise<AgentCoreResponse> {
    const { locationId, channel, externalUserId, text, externalMessageId, metadata } = options;

    try {
      // Step 1: Get or create conversation
      const conversation = await conversationRepository.getOrCreateConversation(
        locationId,
        channel,
        externalUserId
      );

      // Step 2: Load conversation history (last 20 messages for context)
      const historyMessages = await conversationRepository.getConversationMessages(
        conversation.id,
        20
      );

      // Convert to conversation history format
      const conversationHistory = historyMessages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.text,
        }));

      // Step 3: Get agent config (companyName, industry) for prompt context
      const { data: agentConfig } = await supabaseAdmin
        .from('agent_configs')
        .select('business_type')
        .eq('location_id', locationId)
        .maybeSingle();

      const { data: location } = await supabaseAdmin
        .from('locations')
        .select('name')
        .eq('id', locationId)
        .maybeSingle();

      const companyName = location?.name || 'Unser Unternehmen';
      const industry = agentConfig?.business_type || undefined;

      // Step 4: Build RAG context (if enabled)
      let ragContextText = '';
      let ragResultCount = 0;

      if (voiceAgentConfig.rag.enabled) {
        try {
          const ragContext = await ragContextBuilder.buildRagContext({
            locationId,
            query: text,
            maxChunks: voiceAgentConfig.rag.maxChunks,
            maxChars: voiceAgentConfig.rag.maxChars,
            maxCharsPerChunk: voiceAgentConfig.rag.maxCharsPerChunk,
          });

          ragContextText = ragContext.contextText;
          ragResultCount = ragContext.resultCount;

          logger.info('agent_core.rag_context_built', redact({
            locationId,
            channel,
            queryLength: text.length,
            resultCount: ragResultCount,
            injectedChars: ragContext.injectedChars,
          }));
        } catch (error: any) {
          logger.error('agent_core.rag_failed', error, redact({
            locationId,
            channel,
          }));
          // Graceful fallback: continue without RAG context
        }
      }

      // Step 5: Create tool registry (location-scoped)
      const toolRegistry = createToolRegistry(locationId);

      // Step 6: Build prompt context
      const promptContext = ragQueryService.buildPromptContext(
        locationId,
        text,
        { chunks: [], query: text, customerId: locationId }, // Empty RAG result (we use ragContextText instead)
        {
          companyName,
          industry,
          conversationHistory,
          tools: toolRegistry.getToolDefinitions().map((def) => ({
            name: def.name,
            description: def.description,
          })),
        }
      );

      // Inject RAG context text if available
      if (ragContextText) {
        promptContext.ragContextText = ragContextText;
      }

      // Step 7: Channel-aware prompt adjustments
      // For text channels, make responses shorter and more actionable
      const channelPrompt = channel === 'whatsapp' || channel === 'webchat'
        ? 'Antworte kurz und präzise. Verwende klare CTAs (z.B. "Termin buchen", "Rückruf anfordern").'
        : '';

      if (channelPrompt) {
        // Append to system prompt (would need to modify buildSystemPrompt, but for now we'll handle in response)
        // This is a simplified approach - in production, you might want to pass channel to prompt builder
      }

      // Step 8: Get LLM response
      const response = await chatService.chatComplete(text, {
        context: promptContext,
        tools: toolRegistry.getToolDefinitions().map((def) => ({
          name: def.name,
          description: def.description,
          parameters: def.parameters,
        })),
      });

      // Step 9: Execute tool calls if any
      const toolCalls = response.toolCalls || [];
      const executedToolCalls: AgentCoreResponse['toolCalls'] = [];

      for (const toolCall of toolCalls) {
        try {
          const result = await toolRegistry.execute(toolCall);
          executedToolCalls.push({
            name: toolCall.name,
            arguments: toolCall.arguments,
            result,
          });
        } catch (error: any) {
          logger.error('agent_core.tool_execution_failed', error, redact({
            locationId,
            channel,
            toolName: toolCall.name,
          }));
          executedToolCalls.push({
            name: toolCall.name,
            arguments: toolCall.arguments,
            error: error.message,
          });
        }
      }

      // Step 10: Save user message
      await conversationRepository.saveMessage(
        conversation.id,
        locationId,
        channel,
        'user',
        text,
        externalMessageId,
        metadata
      );

      // Step 11: Save assistant response
      await conversationRepository.saveMessage(
        conversation.id,
        locationId,
        channel,
        'assistant',
        response.content,
        undefined,
        {
          toolCalls: executedToolCalls,
          ragResultCount,
        }
      );

      // Step 12: Channel-aware response formatting
      // For text channels, ensure response is concise
      let finalText = response.content;
      if ((channel === 'whatsapp' || channel === 'webchat') && finalText.length > 500) {
        // Truncate very long responses (WhatsApp has 4096 char limit, but we want shorter)
        finalText = finalText.substring(0, 500) + '...';
      }

      return {
        text: finalText,
        toolCalls: executedToolCalls.length > 0 ? executedToolCalls : undefined,
      };
    } catch (error: any) {
      logger.error('agent_core.handle_message_failed', error, redact({
        locationId,
        channel,
        externalUserId,
        textLength: text.length,
      }));

      // Return a safe fallback response
      return {
        text: 'Entschuldigung, es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.',
      };
    }
  }
}

export const agentCore = new AgentCore();
