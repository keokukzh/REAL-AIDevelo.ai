/**
 * Test Agents Service
 * Provides pre-configured demo agents for preview mode
 */

export interface TestAgent {
  id: string;
  name: string;
  description: string;
  industry: string;
  language: string;
  audioUrl?: string;
  demoText: string;
}

/**
 * Get all available test agents for preview mode
 */
export function getTestAgents(): TestAgent[] {
  return [
    {
      id: 'test-agent-1',
      name: 'Restaurant Pro',
      description: 'Optimierter Agent für Schweizer Gastronomie',
      industry: 'Gastronomie',
      language: 'de-CH',
      // Audio is generated dynamically by TTS service
      demoText:
        'Grüezi! Willkomme bi aidevelo.ai. Ich bin Ihre digitale Assistent für Reservierige. Wie cha ich Ihne hüt hälfe?',
    },
    {
      id: 'test-agent-2',
      name: 'Service Expert',
      description: 'Demo-Agent für technischi Dienstleistige',
      industry: 'Service / Handwerk',
      language: 'de-CH',
      // Audio is generated dynamically by TTS service
      demoText:
        'Guten Tag! Vielen Dank für Ihren Anruf. Unser Team ist spezialisiert auf effiziente Lösungen. Möchten Sie einen Beratungstermin vereinbaren?',
    },
    {
      id: 'test-agent-3',
      name: 'E-Commerce Assistant',
      description: 'Support Agent für Online-Shops',
      industry: 'E-Commerce',
      language: 'de-CH',
      // Audio is generated dynamically by TTS service
      demoText:
        'Hoi! Ich hälfe Ihne gärn bi Froge zue Ihrer Bestellig oder bi dr Auswahl vom passende Produkt. Was suechid Sie gnau?',
    },
  ];
}

/**
 * Get a specific test agent by ID
 */
export function getTestAgentById(id: string): TestAgent | undefined {
  return getTestAgents().find((agent) => agent.id === id);
}
