import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/Button';
import { apiRequest, ApiRequestError } from '../services/api';
import { MessageCircle, Send, Minimize2, Maximize2, Loader2 } from 'lucide-react';

interface OnboardingAIAssistantProps {
  currentTask: string | null;
  formData: any;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const OnboardingAIAssistant: React.FC<OnboardingAIAssistantProps> = ({
  currentTask,
  formData,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hallo! Ich bin Ihr AI-Assistent und helfe Ihnen beim Onboarding. Wie kann ich Ihnen helfen?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await apiRequest<{ success: boolean; data: { message: string } }>('/onboarding/ai-assistant', {
        method: 'POST',
        data: {
          message: input,
          currentTask,
          formData,
        },
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.message,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = error instanceof ApiRequestError
        ? error.message
        : 'Fehler beim Senden der Nachricht. Bitte versuchen Sie es erneut.';
      
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Entschuldigung, es ist ein Fehler aufgetreten: ${errorMessage}`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          variant="primary"
          onClick={() => setIsOpen(true)}
          className="rounded-full w-14 h-14 p-0 shadow-lg"
        >
          <MessageCircle size={24} />
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-surface/50 border border-white/10 rounded-xl overflow-hidden flex flex-col ${
        isMinimized ? 'h-auto' : 'h-[600px]'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-surface/80">
        <div className="flex items-center gap-2">
          <MessageCircle className="text-accent" size={20} />
          <span className="font-bold">AI-Assistent</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 h-auto"
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="p-1 h-auto"
          >
            ×
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-accent text-black'
                      : 'bg-white/5 text-white'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-60 mt-1">
                    {message.timestamp.toLocaleTimeString('de-CH', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/5 rounded-lg p-3">
                  <Loader2 className="animate-spin text-accent" size={16} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Fragen Sie den Assistenten..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg p-2 text-white focus:border-accent outline-none text-sm"
                disabled={loading}
              />
              <Button
                variant="primary"
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="px-4"
              >
                <Send size={16} />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Der Assistent hilft Ihnen bei allen Onboarding-Aufgaben.
            </p>
          </div>
        </>
      )}
    </motion.div>
  );
};

