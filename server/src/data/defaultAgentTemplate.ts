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
    voiceSettings: {
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
    companyName: 'Demo Agent',
    industry: 'Allgemein',
    description: '24/7 KI Voice Agent - Bereit für Anpassung',
    city: 'Zürich',
    openingHours: 'Rund um die Uhr verfügbar',
  },
  config: {
    language: 'de-CH',
    recordingConsent: false,
    goals:
      'Anrufe entgegennehmen, Leads qualifizieren, Termine vereinbaren und Kundenanfragen professionell bearbeiten.',
    voiceSettings: {
      // Default professional voice
      voiceId: 'adam-professional',
      modelId: 'azure-neural-v1',
      voiceName: 'Adam (Azure Neural)',
    },
    systemPrompt: `Du bist ein hochprofessioneller KI Voice Agent von AIDevelo. Deine Mission:

🎯 HAUPTAUFGABEN:
- Begrüße jeden Anrufer freundlich und kompetent
- Qualifiziere Leads durch gezielte Fragen
- Beantworte Fragen präzise und hilfreich
- Vereinbare Termine mit dem Team
- Nimm wichtige Informationen auf

💡 KOMMUNIKATIONSSTIL:
- Klar, verständlich und professionell
- Schweizerische Höflichkeit mit Effizienz
- Immer lösungsorientiert
- Natürlich und menschlich

⚡ WICHTIG:
- Du bist 24/7 verfügbar
- Bei komplexen Fragen: Notiere Details für Rückruf
- Bleibe stets höflich, geduldig und zielführend
- Verwende Schweizer Hochdeutsch`,
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
