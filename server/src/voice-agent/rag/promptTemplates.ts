import { RAGQueryResult } from '../types';

/**
 * Prompt Templates for Voice Agent
 * Handles Swiss German/High German context and RAG context injection
 */

export interface PromptContext {
  customerId: string;
  companyName?: string;
  industry?: string;
  ragContext?: RAGQueryResult;
  ragContextText?: string; // New: formatted RAG context from contextBuilder
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  tools?: Array<{ name: string; description: string }>;
}

/**
 * Build system prompt with RAG context
 */
export function buildSystemPrompt(context: PromptContext): string {
  const { companyName, industry, ragContextText, tools } = context;

  let prompt = `Du bist ein professioneller, höflicher Assistent für ${companyName || 'ein Schweizer Unternehmen'}`;
  
  if (industry) {
    prompt += ` in der Branche ${industry}`;
  }
  
  prompt += `.\n\n`;

  // Add RAG context if available (new format from contextBuilder)
  if (ragContextText && ragContextText.length > 0) {
    prompt += `${ragContextText}\n\n`;
  } else if (context.ragContext && context.ragContext.chunks.length > 0) {
    // Fallback to old format for backward compatibility
    prompt += `Relevante Informationen:\n`;
    context.ragContext.chunks.forEach((chunk, index) => {
      prompt += `${index + 1}. ${chunk.text}\n`;
    });
    prompt += `\n`;
  }

  // Add instructions
  prompt += `Deine Aufgaben:\n`;
  prompt += `- Beantworte Anrufe professionell und höflich\n`;
  prompt += `- Verwende formelles "Sie" (außer explizit anders gewünscht)\n`;
  prompt += `- Formatiere Datum als DD.MM.YYYY\n`;
  prompt += `- Gib keine rechtlichen oder medizinischen Ratschläge\n`;
  prompt += `- Bei Unsicherheit: Biete an, eine Nachricht zu hinterlassen oder einen Rückruf zu vereinbaren\n`;
  prompt += `- Antworte kurz und präzise\n`;
  prompt += `- Vermeide unaussprechbare Zeichen oder Emojis\n`;

  // Add tool instructions if available
  if (tools && tools.length > 0) {
    prompt += `\nVerfügbare Tools:\n`;
    tools.forEach((tool) => {
      prompt += `- ${tool.name}: ${tool.description}\n`;
    });
    prompt += `\nNutze diese Tools, wenn der Benutzer entsprechende Anfragen stellt.\n`;
  }

  prompt += `\nAm Ende des Gesprächs: Fasse zusammen, was vereinbart wurde, und wünsche einen schönen Tag.`;

  return prompt;
}

/**
 * Build user message with conversation history
 */
export function buildUserMessage(
  userInput: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
): string {
  // For now, just return the current input
  // In a more sophisticated implementation, we could include recent history
  return userInput;
}

/**
 * Build messages array for LLM
 */
export function buildMessages(context: PromptContext): Array<{
  role: 'system' | 'user' | 'assistant';
  content: string;
}> {
  const messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }> = [];

  // System prompt
  messages.push({
    role: 'system',
    content: buildSystemPrompt(context),
  });

  // Conversation history
  if (context.conversationHistory) {
    context.conversationHistory.forEach((msg) => {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    });
  }

  return messages;
}


