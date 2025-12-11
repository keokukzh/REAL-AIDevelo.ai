/**
 * Default Agent Template
 * Used for auto-provisioning standard agents for new users
 */

export interface DefaultAgentTemplate {
  businessProfile: {
    companyName: string;
    industry: string;
    description: string;
    city: string;
    openingHours: string;
  };
  config: {
    language: string;
    recordingConsent: boolean;
    goals: string;
    elevenLabs: {
      voiceId: string;
      modelId: string;
      voiceName: string;
    };
    systemPrompt: string;
  };
}

/**
 * Default template configuration for new users
 * Universal template with neutral professional voice
 */
export const DEFAULT_AGENT_TEMPLATE: DefaultAgentTemplate = {
  businessProfile: {
    companyName: 'Mein Unternehmen',
    industry: 'Allgemein',
    description: 'Universell einsetzbarer Telefon-Agent',
    city: 'Zürich',
    openingHours: 'Montag bis Freitag, 9:00 - 17:00 Uhr',
  },
  config: {
    language: 'de-CH',
    recordingConsent: false,
    goals: 'Anrufe entgegennehmen, Informationen bereitstellen und bei Bedarf an zuständige Mitarbeiter weiterleiten.',
    elevenLabs: {
      // Default professional voice - German, neutral
      voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam - professional male voice
      modelId: 'eleven_turbo_v2_5',
      voiceName: 'Standard Stimme (Professionell)',
    },
    systemPrompt: `Du bist ein freundlicher, professioneller Telefon-Assistent. Deine Aufgaben:
- Begrüße Anrufer höflich und professionell
- Beantworte allgemeine Fragen zum Unternehmen
- Nimm Nachrichten entgegen und notiere wichtige Informationen
- Leite bei Bedarf an zuständige Mitarbeiter weiter
- Bleibe stets höflich, geduldig und hilfsbereit

WICHTIGE HINWEISE:
- Sprich klar und deutlich
- Verwende eine formelle, professionelle Sprache
- Halte Antworten präzise und relevant
- Falls du eine Frage nicht beantworten kannst, biete an, einen Rückruf zu organisieren`,
  },
};

/**
 * Generate a default agent configuration for a new user
 * @param userId - The user ID to associate the agent with
 * @param userEmail - User email for personalization (optional)
 * @returns Partial VoiceAgent object ready for DB insertion
 */
export function generateDefaultAgentForUser(userId: string, userEmail?: string) {
  const template = DEFAULT_AGENT_TEMPLATE;
  
  return {
    businessProfile: {
      ...template.businessProfile,
      // Optionally personalize with user email domain
      companyName: userEmail 
        ? `${userEmail.split('@')[0]} - Assistent`
        : template.businessProfile.companyName,
    },
    config: template.config,
    status: 'draft' as const,
    metadata: {
      isDefaultAgent: true,
      createdFrom: 'auto-provision',
    },
  };
}
