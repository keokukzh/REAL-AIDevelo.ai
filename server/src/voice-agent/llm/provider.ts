import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { voiceAgentConfig } from '../config';
import { LLMProvider, LLMMessage, LLMResponse, ToolCall } from '../types';

/**
 * LLM Provider Abstraction
 * Supports multiple LLM providers with unified interface
 */

export interface LLMProviderInterface {
  chat(
    messages: LLMMessage[],
    tools?: Array<{ name: string; description: string; parameters: any }>,
    stream?: boolean
  ): Promise<LLMResponse | AsyncIterable<LLMResponse>>;
}

class OpenAIProvider implements LLMProviderInterface {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: voiceAgentConfig.llm.openaiApiKey,
      dangerouslyAllowBrowser: false,
    });
  }

  async chat(
    messages: LLMMessage[],
    tools?: Array<{ name: string; description: string; parameters: any }>,
    stream: boolean = false
  ): Promise<LLMResponse | AsyncIterable<LLMResponse>> {
    const formattedMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const toolDefinitions = tools?.map((tool) => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));

    if (stream) {
      const stream = await this.client.chat.completions.create({
        model: voiceAgentConfig.llm.model,
        messages: formattedMessages as any,
        tools: toolDefinitions,
        stream: true,
      });

      return this.handleStream(stream);
    }

    const response = await this.client.chat.completions.create({
      model: voiceAgentConfig.llm.model,
      messages: formattedMessages as any,
      tools: toolDefinitions,
    });

    const choice = response.choices[0];
    const message = choice.message;

    const toolCalls: ToolCall[] | undefined = message.tool_calls?.map((tc) => {
      if (tc.type === 'function') {
        return {
          name: tc.function.name,
          arguments: JSON.parse(tc.function.arguments),
        };
      }
      return {
        name: '',
        arguments: {},
      };
    });

    return {
      content: message.content || '',
      toolCalls,
      finishReason: choice.finish_reason as any,
    };
  }

  private async *handleStream(
    stream: any
  ): AsyncIterable<LLMResponse> {
    let fullContent = '';
    let toolCalls: ToolCall[] = [];

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        fullContent += delta.content;
        yield {
          content: fullContent,
          toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        };
      }
      if (delta?.tool_calls) {
        for (const toolCall of delta.tool_calls) {
          const index = toolCall.index;
          if (!toolCalls[index]) {
            toolCalls[index] = {
              name: toolCall.function?.name || '',
              arguments: {},
            };
          }
          if (toolCall.function?.arguments) {
            try {
              toolCalls[index].arguments = JSON.parse(
                toolCalls[index].arguments
                  ? JSON.stringify(toolCalls[index].arguments) +
                      toolCall.function.arguments
                  : toolCall.function.arguments
              );
            } catch {
              // Partial JSON, continue accumulating
            }
          }
        }
      }
    }
  }
}

class AnthropicProvider implements LLMProviderInterface {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: voiceAgentConfig.llm.anthropicApiKey,
    });
  }

  async chat(
    messages: LLMMessage[],
    tools?: Array<{ name: string; description: string; parameters: any }>,
    stream: boolean = false
  ): Promise<LLMResponse | AsyncIterable<LLMResponse>> {
    // Convert messages format for Anthropic
    const systemMessage = messages.find((m) => m.role === 'system');
    const conversationMessages = messages.filter((m) => m.role !== 'system');

    const formattedMessages = conversationMessages.map((msg) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    })) as any;

    const toolDefinitions = tools?.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.parameters,
    }));

    if (stream) {
      const stream = await this.client.messages.stream({
        model: voiceAgentConfig.llm.model,
        max_tokens: 4096,
        system: systemMessage?.content,
        messages: formattedMessages,
        tools: toolDefinitions,
      });

      return this.handleAnthropicStream(stream);
    }

    const response = await this.client.messages.create({
      model: voiceAgentConfig.llm.model,
      max_tokens: 4096,
      system: systemMessage?.content,
      messages: formattedMessages,
      tools: toolDefinitions,
    });

    const content = response.content.find((c) => c.type === 'text');
    const toolCalls: ToolCall[] | undefined = response.content
      .filter((c) => c.type === 'tool_use')
      .map((c: any) => ({
        name: c.name,
        arguments: c.input,
      }));

    return {
      content: content?.type === 'text' ? content.text : '',
      toolCalls,
    };
  }

  private async *handleAnthropicStream(
    stream: any
  ): AsyncIterable<LLMResponse> {
    let fullContent = '';

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta') {
        if (chunk.delta.type === 'text_delta') {
          fullContent += chunk.delta.text;
          yield {
            content: fullContent,
          };
        }
      }
    }
  }
}

class DeepSeekProvider implements LLMProviderInterface {
  private client: OpenAI;

  constructor() {
    // DeepSeek uses OpenAI-compatible API
    this.client = new OpenAI({
      apiKey: voiceAgentConfig.llm.deepseekApiKey,
      baseURL: 'https://api.deepseek.com',
      dangerouslyAllowBrowser: false,
    });
  }

  async chat(
    messages: LLMMessage[],
    tools?: Array<{ name: string; description: string; parameters: any }>,
    stream: boolean = false
  ): Promise<LLMResponse | AsyncIterable<LLMResponse>> {
    const formattedMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const toolDefinitions = tools?.map((tool) => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));

    if (stream) {
      const stream = await this.client.chat.completions.create({
        model: voiceAgentConfig.llm.model,
        messages: formattedMessages as any,
        tools: toolDefinitions,
        stream: true,
      });

      return this.handleStream(stream);
    }

    const response = await this.client.chat.completions.create({
      model: voiceAgentConfig.llm.model,
      messages: formattedMessages as any,
      tools: toolDefinitions,
    });

    const choice = response.choices[0];
    const message = choice.message;

    const toolCalls: ToolCall[] | undefined = message.tool_calls?.map((tc) => {
      if (tc.type === 'function') {
        return {
          name: tc.function.name,
          arguments: JSON.parse(tc.function.arguments),
        };
      }
      return {
        name: '',
        arguments: {},
      };
    });

    return {
      content: message.content || '',
      toolCalls,
      finishReason: choice.finish_reason as any,
    };
  }

  private async *handleStream(
    stream: any
  ): AsyncIterable<LLMResponse> {
    let fullContent = '';
    let toolCalls: ToolCall[] = [];

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        fullContent += delta.content;
        yield {
          content: fullContent,
          toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        };
      }
      if (delta?.tool_calls) {
        for (const toolCall of delta.tool_calls) {
          const index = toolCall.index;
          if (!toolCalls[index]) {
            toolCalls[index] = {
              name: toolCall.function?.name || '',
              arguments: {},
            };
          }
          if (toolCall.function?.arguments) {
            try {
              toolCalls[index].arguments = JSON.parse(
                toolCalls[index].arguments
                  ? JSON.stringify(toolCalls[index].arguments) +
                      toolCall.function.arguments
                  : toolCall.function.arguments
              );
            } catch {
              // Partial JSON, continue accumulating
            }
          }
        }
      }
    }
  }
}

/**
 * Get LLM provider based on configuration
 */
export function getLLMProvider(): LLMProviderInterface {
  const provider = voiceAgentConfig.llm.provider;

  switch (provider) {
    case 'openai':
      return new OpenAIProvider();
    case 'anthropic':
      return new AnthropicProvider();
    case 'deepseek':
      return new DeepSeekProvider();
    default:
      return new OpenAIProvider();
  }
}

export const llmProvider = getLLMProvider();

