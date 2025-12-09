export interface VoiceAgentSession {
  id: string;
  customerId: string;
  agentId: string;
  status: 'active' | 'ended' | 'error';
  createdAt: Date;
  endedAt?: Date;
  context?: {
    conversationHistory: Array<{
      role: 'user' | 'assistant' | 'system';
      content: string;
      timestamp: Date;
    }>;
    metadata?: Record<string, any>;
  };
}

export interface RAGDocument {
  id: string;
  customerId: string;
  source: string; // file path or URL
  content: string;
  chunks: Array<{
    id: string;
    text: string;
    embedding?: number[];
    metadata?: Record<string, any>;
  }>;
  indexedAt: Date;
  metadata?: {
    fileName?: string;
    fileType?: string;
    fileSize?: number;
  };
}

export interface CallHistory {
  id: string;
  sessionId: string;
  customerId: string;
  agentId: string;
  duration: number; // seconds
  transcript?: string;
  summary?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface RAGQueryResult {
  chunks: Array<{
    text: string;
    score: number;
    metadata?: Record<string, any>;
  }>;
  query: string;
  customerId: string;
}

export interface ToolCall {
  name: string;
  arguments: Record<string, any>;
  result?: any;
  error?: string;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  toolCalls?: ToolCall[];
  finishReason?: 'stop' | 'tool_calls' | 'length';
}

export type LLMProvider = 'openai' | 'anthropic' | 'deepseek';
export type ASRProvider = 'openai_realtime' | 'deepgram' | 'assemblyai';


