import { OpenAI } from 'openai';
import { config } from '../config/env';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: false,
});

interface AssistantContext {
  currentTask: string | null;
  formData: any;
  message: string;
}

export const onboardingAIService = {
  /**
   * Generate AI assistant response based on context
   */
  async generateResponse(context: AssistantContext): Promise<string> {
    try {
      // Build system prompt with context
      const systemPrompt = this.buildSystemPrompt(context);

      // If no OpenAI API key, return mock response for development
      if (!process.env.OPENAI_API_KEY) {
        return this.getMockResponse(context);
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: context.message,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      return completion.choices[0]?.message?.content || 'Entschuldigung, ich konnte keine Antwort generieren.';
    } catch (error) {
      console.error('[OnboardingAIService] Error generating response:', error);
      // Fallback to mock response on error
      return this.getMockResponse(context);
    }
  },

  /**
   * Build system prompt with onboarding context
   */
  buildSystemPrompt(context: AssistantContext): string {
    const taskDescriptions: Record<string, string> = {
      company: 'Der Benutzer gibt gerade Firmendaten ein (Firmenname, Branche, Kontakt).',
      hours: 'Der Benutzer legt die Öffnungszeiten fest, wann der Agent Anrufe entgegennehmen soll.',
      goals: 'Der Benutzer definiert die Ziele des Voice Agents (z.B. Terminbuchung, Lead-Qualifizierung).',
      calendar: 'Der Benutzer verbindet seinen Kalender für automatische Buchungen.',
      voice: 'Der Benutzer klont seine Stimme für den Voice Agent.',
    };

    const currentTaskDesc = context.currentTask
      ? taskDescriptions[context.currentTask] || ''
      : 'Der Benutzer befindet sich im Onboarding-Prozess.';

    return `Du bist ein hilfreicher AI-Assistent für das Onboarding von AIDevelo.ai, einem Voice-Agent-Service für Schweizer KMU.

Kontext:
- ${currentTaskDesc}
- Bereits eingegebene Daten: ${JSON.stringify(context.formData, null, 2)}

Deine Aufgabe:
- Beantworte Fragen zum Onboarding-Prozess
- Erkläre die verschiedenen Aufgaben und Schritte
- Gib hilfreiche Tipps und Best Practices
- Antworte auf Deutsch (Schweizerdeutsch ist in Ordnung)
- Sei freundlich, professionell und präzise
- Wenn der Benutzer Fragen zu einer spezifischen Aufgabe hat, erkläre diese detailliert

Antworte kurz und prägnant (max. 3-4 Sätze).`;
  },

  /**
   * Get mock response for development (when no API key)
   */
  getMockResponse(context: AssistantContext): string {
    const responses: Record<string, string> = {
      company: 'Geben Sie bitte den Firmennamen und eine E-Mail-Adresse ein. Diese Informationen werden für die Konfiguration Ihres Voice Agents benötigt.',
      hours: 'Sie können wählen, ob der Agent 24/7 erreichbar sein soll oder nur ausserhalb der Geschäftszeiten. 24/7 wird empfohlen, um keine Anrufe zu verpassen.',
      goals: 'Definieren Sie die Hauptaufgabe Ihres Agents. Sie können mehrere Ziele auswählen, z.B. Terminbuchung, Lead-Qualifizierung oder Support.',
      calendar: 'Verbinden Sie Ihren Kalender (Google Calendar oder Outlook), damit der Agent automatisch Termine buchen kann.',
      voice: 'Beim Voice Cloning nehmen Sie einige Sätze auf, damit der Agent in Ihrer Stimme sprechen kann.',
    };

    if (context.currentTask && responses[context.currentTask]) {
      return responses[context.currentTask];
    }

    return 'Ich helfe Ihnen gerne beim Onboarding! Stellen Sie mir eine Frage zu den Aufgaben oder dem Prozess.';
  },
};

