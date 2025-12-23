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
      name: 'Restaurant Agent',
      description: 'Demo-Agent für Restaurant-Reservierungen',
      industry: 'restaurant',
      language: 'de-CH',
      demoText: 'Guten Tag! Willkommen bei unserem Restaurant. Wie kann ich Ihnen heute helfen? Möchten Sie einen Tisch reservieren?',
    },
    {
      id: 'test-agent-2',
      name: 'Service Agent',
      description: 'Demo-Agent für Service-Terminvereinbarungen',
      industry: 'service',
      language: 'de-CH',
      demoText: 'Hallo! Vielen Dank für Ihren Anruf. Unser Service-Team hilft Ihnen gerne weiter. Wann passt es Ihnen am besten für einen Termin?',
    },
    {
      id: 'test-agent-3',
      name: 'Allgemeiner Agent',
      description: 'Allgemeiner Demo-Agent für verschiedene Branchen',
      industry: 'general',
      language: 'de-CH',
      demoText: 'Guten Tag! Vielen Dank für Ihren Anruf. Wie kann ich Ihnen heute helfen?',
    },
  ];
}

/**
 * Get a specific test agent by ID
 */
export function getTestAgentById(id: string): TestAgent | undefined {
  return getTestAgents().find(agent => agent.id === id);
}

