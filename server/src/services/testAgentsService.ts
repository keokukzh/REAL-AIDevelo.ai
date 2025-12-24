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
      audioUrl: 'https://cdn.pixabay.com/audio/2022/03/10/audio_c35270364f.mp3', // Placeholder audio
      demoText: 'Grüezi! Willkomme bi aidevelo.ai. Ich bin Ihre digitale Assistent für Reservierige. Wie cha ich Ihne hüt hälfe?',
    },
    {
      id: 'test-agent-2',
      name: 'Service Expert',
      description: 'Demo-Agent für technischi Dienstleistige',
      industry: 'Service / Handwerk',
      language: 'de-CH',
      audioUrl: 'https://cdn.pixabay.com/audio/2022/01/21/audio_248c084f67.mp3', // Placeholder audio
      demoText: 'Guten Tag! Vielen Dank für Ihren Anruf. Unser Team ist spezialisiert auf effiziente Lösungen. Möchten Sie einen Beratungstermin vereinbaren?',
    },
    {
      id: 'test-agent-3',
      name: 'E-Commerce Assistant',
      description: 'Support Agent für Online-Shops',
      industry: 'E-Commerce',
      language: 'de-CH',
      audioUrl: 'https://cdn.pixabay.com/audio/2022/03/15/audio_1e3e8f8f3c.mp3', // Placeholder audio
      demoText: 'Hoi! Ich hälfe Ihne gärn bi Froge zue Ihrer Bestellig oder bi dr Auswahl vom passende Produkt. Was suechid Sie gnau?',
    },
  ];
}

/**
 * Get a specific test agent by ID
 */
export function getTestAgentById(id: string): TestAgent | undefined {
  return getTestAgents().find(agent => agent.id === id);
}

