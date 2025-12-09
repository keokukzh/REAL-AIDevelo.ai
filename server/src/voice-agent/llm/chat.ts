import { llmProvider } from './provider';
import { LLMMessage, LLMResponse, ToolCall } from '../types';
import { buildMessages, PromptContext } from '../rag/promptTemplates';

/**
 * Chat Service
 * Handles LLM interactions with RAG context and tool calling
 */

export interface ChatOptions {
  context: PromptContext;
  tools?: Array<{
    name: string;
    description: string;
    parameters: any;
  }>;
  stream?: boolean;
}

export class ChatService {
  /**
   * Chat with LLM using RAG context
   */
  async chat(
    userInput: string,
    options: ChatOptions
  ): Promise<LLMResponse | AsyncIterable<LLMResponse>> {
    const { context, tools, stream = false } = options;

    // Build messages with RAG context
    const messages = buildMessages({
      ...context,
      conversationHistory: [
        ...(context.conversationHistory || []),
        { role: 'user', content: userInput },
      ],
    });

    // Call LLM
    const response = await llmProvider.chat(messages, tools, stream);

    return response;
  }

  /**
   * Chat with streaming support
   */
  async chatStream(
    userInput: string,
    options: ChatOptions
  ): Promise<AsyncIterable<LLMResponse>> {
    const response = await this.chat(userInput, { ...options, stream: true });
    if (Symbol.asyncIterator in response) {
      return response as AsyncIterable<LLMResponse>;
    }
    // Fallback: wrap single response in async iterable
    return (async function* () {
      yield response as LLMResponse;
    })();
  }

  /**
   * Chat without streaming
   */
  async chatComplete(
    userInput: string,
    options: ChatOptions
  ): Promise<LLMResponse> {
    const response = await this.chat(userInput, { ...options, stream: false });
    if (Symbol.asyncIterator in response) {
      // If streaming was returned, collect all chunks
      let finalResponse: LLMResponse = { content: '' };
      for await (const chunk of response as AsyncIterable<LLMResponse>) {
        finalResponse = chunk;
      }
      return finalResponse;
    }
    return response as LLMResponse;
  }
}

export const chatService = new ChatService();


