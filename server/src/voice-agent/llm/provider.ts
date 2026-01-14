import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { voiceAgentConfig } from '../config';
import { LLMMessage, LLMResponse, ToolCall } from '../types';

/**
 * LLM Provider Abstraction
 * Supports multiple LLM providers with unified interface
 */

export interface LLMProviderInterface {
  chat(
    messages: LLMMessage[],
    tools?: Array<{ name: string; description: string; parameters: any }>,
    stream?: boolean,
  ): Promise<LLMResponse | AsyncIterable<LLMResponse>>;
}

class OpenAIProvider implements LLMProviderInterface {
  private client: OpenAI;

  constructor() {
    const apiKey = voiceAgentConfig.llm.openaiApiKey;
    if (!apiKey || apiKey === '' || apiKey.includes('placeholder')) {
      this.client = null as any;
      console.warn('[OpenAIProvider] Missing or placeholder OpenAI API key.');
      return;
    }
    this.client = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: false,
    });
  }

  async chat(
    messages: LLMMessage[],
    tools?: Array<{ name: string; description: string; parameters: any }>,
    stream: boolean = false,
  ): Promise<LLMResponse | AsyncIterable<LLMResponse>> {
    if (!this.client) {
      throw new Error('OpenAI client is not initialized. Check API key.');
    }

    const formattedMessages = messages.map((msg) => ({
      role: msg.role as any,
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
      const streamRes = await this.client.chat.completions.create({
        model: voiceAgentConfig.llm.model,
        messages: formattedMessages,
        tools: toolDefinitions as any,
        stream: true,
      });

      return this.handleStream(streamRes);
    }

    const response = await this.client.chat.completions.create({
      model: voiceAgentConfig.llm.model,
      messages: formattedMessages,
      tools: toolDefinitions as any,
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

  private async *handleStream(stream: any): AsyncIterable<LLMResponse> {
    let fullContent = '';
    const toolCalls: ToolCall[] = [];

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
              const currentArgs =
                typeof toolCalls[index].arguments === 'string'
                  ? toolCalls[index].arguments
                  : JSON.stringify(toolCalls[index].arguments);
              const newArgs = currentArgs + toolCall.function.arguments;
              toolCalls[index].arguments = JSON.parse(newArgs);
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
    const apiKey = voiceAgentConfig.llm.anthropicApiKey;
    if (!apiKey || apiKey === '' || apiKey.includes('placeholder')) {
      this.client = null as any;
      console.warn('[AnthropicProvider] Missing or placeholder Anthropic API key.');
      return;
    }
    this.client = new Anthropic({
      apiKey: apiKey,
    });
  }

  async chat(
    messages: LLMMessage[],
    tools?: Array<{ name: string; description: string; parameters: any }>,
    stream: boolean = false,
  ): Promise<LLMResponse | AsyncIterable<LLMResponse>> {
    if (!this.client) {
      throw new Error('Anthropic client is not initialized. Check API key.');
    }

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
      const streamRes = await this.client.messages.stream({
        model: voiceAgentConfig.llm.model,
        max_tokens: 4096,
        system: systemMessage?.content,
        messages: formattedMessages,
        tools: toolDefinitions as any,
      });

      return this.handleAnthropicStream(streamRes);
    }

    const response = await this.client.messages.create({
      model: voiceAgentConfig.llm.model,
      max_tokens: 4096,
      system: systemMessage?.content,
      messages: formattedMessages,
      tools: toolDefinitions as any,
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

  private async *handleAnthropicStream(stream: any): AsyncIterable<LLMResponse> {
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
    const apiKey = voiceAgentConfig.llm.deepseekApiKey;
    if (!apiKey || apiKey === '' || apiKey.includes('placeholder')) {
      this.client = null as any;
      console.warn('[DeepSeekProvider] Missing or placeholder DeepSeek API key.');
      return;
    }
    // DeepSeek uses OpenAI-compatible API
    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://api.deepseek.com',
      dangerouslyAllowBrowser: false,
    });
  }

  async chat(
    messages: LLMMessage[],
    tools?: Array<{ name: string; description: string; parameters: any }>,
    stream: boolean = false,
  ): Promise<LLMResponse | AsyncIterable<LLMResponse>> {
    if (!this.client) {
      throw new Error('DeepSeek client is not initialized. Check API key.');
    }

    const formattedMessages = messages.map((msg) => ({
      role: msg.role as any,
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
      const streamRes = await this.client.chat.completions.create({
        model: voiceAgentConfig.llm.model,
        messages: formattedMessages,
        tools: toolDefinitions as any,
        stream: true,
      });

      return this.handleStream(streamRes);
    }

    const response = await this.client.chat.completions.create({
      model: voiceAgentConfig.llm.model,
      messages: formattedMessages,
      tools: toolDefinitions as any,
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

  private async *handleStream(stream: any): AsyncIterable<LLMResponse> {
    let fullContent = '';
    const toolCalls: ToolCall[] = [];

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
              const currentArgs =
                typeof toolCalls[index].arguments === 'string'
                  ? toolCalls[index].arguments
                  : JSON.stringify(toolCalls[index].arguments);
              const newArgs = currentArgs + toolCall.function.arguments;
              toolCalls[index].arguments = JSON.parse(newArgs);
            } catch {
              // Partial JSON, continue accumulating
            }
          }
        }
      }
    }
  }
}

class VLLMProvider implements LLMProviderInterface {
  private client: OpenAI;

  constructor() {
    // vLLM is OpenAI-compatible
    const baseURL = process.env.VLLM_BASE_URL || 'http://vllm:8000/v1';
    const apiKey = process.env.VLLM_API_KEY || 'dummy';

    this.client = new OpenAI({
      apiKey,
      baseURL,
      dangerouslyAllowBrowser: false,
    });
  }

  async chat(
    messages: LLMMessage[],
    tools?: Array<{ name: string; description: string; parameters: any }>,
    stream: boolean = false,
  ): Promise<LLMResponse | AsyncIterable<LLMResponse>> {
    const formattedMessages = messages.map((msg) => ({
      role: msg.role as any,
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

    // Use model from env or default
    const model = process.env.VLLM_MODEL || voiceAgentConfig.llm.model;

    if (stream) {
      const streamRes = await this.client.chat.completions.create({
        model,
        messages: formattedMessages,
        tools: toolDefinitions as any,
        stream: true,
      });

      return this.handleStream(streamRes);
    }

    const response = await this.client.chat.completions.create({
      model,
      messages: formattedMessages,
      tools: toolDefinitions as any,
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

  private async *handleStream(stream: any): AsyncIterable<LLMResponse> {
    let fullContent = '';
    const toolCalls: ToolCall[] = [];

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
              const currentArgs =
                typeof toolCalls[index].arguments === 'string'
                  ? toolCalls[index].arguments
                  : JSON.stringify(toolCalls[index].arguments);
              const newArgs = currentArgs + toolCall.function.arguments;
              toolCalls[index].arguments = JSON.parse(newArgs);
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
  const provider = (process.env.LLM_PROVIDER || voiceAgentConfig.llm.provider) as
    | 'openai'
    | 'anthropic'
    | 'deepseek'
    | 'vllm';

  switch (provider) {
    case 'openai':
      return new OpenAIProvider();
    case 'anthropic':
      return new AnthropicProvider();
    case 'deepseek':
      return new DeepSeekProvider();
    case 'vllm':
      return new VLLMProvider();
    default:
      // Fallback: try vLLM first, then OpenAI
      try {
        return new VLLMProvider();
      } catch {
        return new OpenAIProvider();
      }
  }
}

export const llmProvider = getLLMProvider();
