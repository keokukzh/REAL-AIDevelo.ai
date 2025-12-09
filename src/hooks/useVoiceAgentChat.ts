import { useState, useCallback } from 'react';
import { apiRequest } from '../services/api';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: Array<{
    name: string;
    arguments: any;
    result?: any;
    error?: string;
  }>;
}

export interface UseVoiceAgentChatOptions {
  customerId: string;
  sessionId?: string;
  onError?: (error: Error) => void;
}

export function useVoiceAgentChat(options: UseVoiceAgentChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = useCallback(
    async (query: string) => {
      if (!query.trim()) return;

      // Add user message
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: query,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setIsTyping(true);

      try {
        const response = await apiRequest<{
          success: boolean;
          data: {
            response: string;
            toolCalls?: Array<{
              name: string;
              arguments: any;
              result?: any;
              error?: string;
            }>;
            ragContext?: string[];
          };
        }>('/voice-agent/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerId: options.customerId,
            query,
            sessionId: options.sessionId,
          }),
        });

        if (response.success && response.data) {
          const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response.data.response,
            timestamp: new Date(),
            toolCalls: response.data.toolCalls,
          };

          setMessages((prev) => [...prev, assistantMessage]);
        } else {
          throw new Error('Failed to get response');
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        options.onError?.(new Error(errorMessage));

        // Add error message
        const errorMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Entschuldigung, es ist ein Fehler aufgetreten: ${errorMessage}`,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
        setIsTyping(false);
      }
    },
    [options.customerId, options.sessionId, options.onError]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    isTyping,
    sendMessage,
    clearMessages,
  };
}


