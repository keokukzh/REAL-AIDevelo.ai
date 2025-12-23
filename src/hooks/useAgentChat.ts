/**
 * useAgentChat Hook
 * Handles chat mode for agent testing with text input and voice output
 */

import { useState, useRef, useCallback } from 'react';
import { apiClient } from '../services/apiClient';

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  toolCalls?: Array<{
    name: string;
    arguments: any;
    result?: any;
    error?: string;
  }>;
}

export interface UseAgentChatOptions {
  locationId: string;
  onMessageSent?: (message: ChatMessage) => void;
  onResponseReceived?: (message: ChatMessage) => void;
}

export interface UseAgentChatReturn {
  messages: ChatMessage[];
  input: string;
  setInput: (input: string) => void;
  isSending: boolean;
  sendMessage: (text?: string) => Promise<void>;
  clearMessages: () => void;
  audioRef: React.RefObject<HTMLAudioElement>;
}

export function useAgentChat(options: UseAgentChatOptions): UseAgentChatReturn {
  const { locationId, onMessageSent, onResponseReceived } = options;
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [callSid, setCallSid] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const sendMessage = useCallback(async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || !locationId || isSending) return;

    setIsSending(true);

    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      text: messageText.trim(),
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => {
      const updated = [...prev, userMessage];
      onMessageSent?.(userMessage);
      return updated;
    });
    
    const currentInput = input;
    setInput('');

    try {
      // Generate call_sid if not exists
      const effectiveCallSid = callSid || `chat_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      if (!callSid) {
        setCallSid(effectiveCallSid);
      }

      const response = await apiClient.post<{
        success: boolean;
        text: string;
        audio_url: string;
        toolCalls?: Array<{
          name: string;
          arguments: any;
          result?: any;
          error?: string;
        }>;
      }>('/v1/test-call/chat-message', {
        location_id: locationId,
        text: messageText.trim(),
        call_sid: effectiveCallSid,
      });

      if (response.data.success) {
        // Add assistant message
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          text: response.data.text,
          timestamp: new Date().toISOString(),
          toolCalls: response.data.toolCalls,
        };
        
        setMessages(prev => {
          const updated = [...prev, assistantMessage];
          onResponseReceived?.(assistantMessage);
          return updated;
        });

        // Play audio response
        if (response.data.audio_url && audioRef.current) {
          audioRef.current.src = response.data.audio_url;
          audioRef.current.play().catch(err => {
            console.error('[useAgentChat] Failed to play audio:', err);
          });
        }
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error: any) {
      console.error('[useAgentChat] Chat message error:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Fehler beim Senden der Nachricht';
      
      // Add error message
      const errorMsg: ChatMessage = {
        role: 'assistant',
        text: `Fehler: ${errorMessage}`,
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => {
        const updated = [...prev, errorMsg];
        onResponseReceived?.(errorMsg);
        return updated;
      });
    } finally {
      setIsSending(false);
    }
  }, [locationId, callSid, isSending, input, onMessageSent, onResponseReceived]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setCallSid(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
  }, []);

  return {
    messages,
    input,
    setInput,
    isSending,
    sendMessage,
    clearMessages,
    audioRef,
  };
}

