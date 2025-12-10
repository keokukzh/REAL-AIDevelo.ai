import { industries } from './industries';

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  language: string;
  languageCode: string;
  industry: string;
  useCase: string[];
  icon: string;
  systemPrompt: string;
  voiceId: string;
  modelId: string;
  defaultSettings: {
    recordingConsent: boolean;
    openingHours: string;
    goals: string[];
  };
  tags: string[];
}

// Voice IDs für verschiedene Sprachen (ElevenLabs)
const VOICE_IDS = {
  'de-CH': '21m00Tcm4TlvDq8ikWAM', // Rachel - German
  'fr-CH': 'EXAVITQu4vr4xnSDxMaL', // Sarah - French
  'it-CH': 'VR6AewLTigWG4xSOukaG', // Antoni - Italian
  'en-US': 'pNInz6obpgDQGcFmaJgB', // Adam - English US
  'en-GB': 'ThT5KcBeYPX3keUQqHPh', // Dorothy - English UK
};

// System Prompts für verschiedene Branchen
const generateSystemPrompt = (industry: string, language: string, useCases: string[]): string => {
  const languageName = {
    'de-CH': 'Schweizerdeutsch',
    'fr-CH': 'Français (Suisse)',
    'it-CH': 'Italiano (Svizzera)',
    'en-US': 'English (US)',
    'en-GB': 'English (UK)',
  }[language] || 'Deutsch';

  const useCaseText = useCases.map(uc => {
    if (uc === 'Terminbuchung & Kalender') return 'Termine professionell buchen und verwalten';
    if (uc === 'Lead-Qualifizierung') return 'Anrufer qualifizieren und wichtige Informationen sammeln';
    if (uc === 'Support & FAQs') return 'Häufige Fragen beantworten und Support leisten';
    if (uc === 'Bestellannahme') return 'Bestellungen entgegennehmen und verarbeiten';
    return uc;
  }).join(', ');

  const industryPrompts: Record<string, string> = {
    'Handwerk / Sanitär': `Du bist ein professioneller, freundlicher Voice-Agent für ein ${industry}-Unternehmen in der Schweiz. Du sprichst ${languageName} und hilfst Kunden bei ${useCaseText}. Du bist präzise, zuverlässig und immer höflich. Bei Terminanfragen fragst du nach dem gewünschten Datum, der Uhrzeit und der Art der Dienstleistung.`,
    'Barber & Beauty': `Du bist ein freundlicher, stilbewusster Voice-Agent für einen ${industry}-Betrieb in der Schweiz. Du sprichst ${languageName} und hilfst Kunden bei ${useCaseText}. Du bist modebewusst, berätst gerne und schaffst eine entspannte Atmosphäre. Bei Terminanfragen fragst du nach dem gewünschten Service, Datum und Uhrzeit.`,
    'Praxis & Medizin': `Du bist ein professioneller, einfühlsamer Voice-Agent für eine ${industry}-Praxis in der Schweiz. Du sprichst ${languageName} und hilfst Patienten bei ${useCaseText}. Du bist diskret, einfühlsam und professionell. Bei Terminanfragen fragst du nach dem Grund des Besuchs, dem gewünschten Datum und der bevorzugten Uhrzeit.`,
    'Garage & Kfz': `Du bist ein kompetenter, serviceorientierter Voice-Agent für eine ${industry} in der Schweiz. Du sprichst ${languageName} und hilfst Kunden bei ${useCaseText}. Du bist technisch versiert, zuverlässig und lösungsorientiert. Bei Terminanfragen fragst du nach dem Fahrzeugtyp, dem Problem und dem gewünschten Termin.`,
    'Immobilien': `Du bist ein professioneller, vertrauenswürdiger Voice-Agent für ein ${industry}-Unternehmen in der Schweiz. Du sprichst ${languageName} und hilfst Interessenten bei ${useCaseText}. Du bist kompetent, freundlich und hilfst gerne bei Immobilienanfragen. Bei Terminanfragen fragst du nach dem Objekttyp, der gewünschten Besichtigungszeit und den Kontaktdaten.`,
    'Ärzte / Gesundheit': `Du bist ein einfühlsamer, professioneller Voice-Agent für eine ${industry}-Praxis in der Schweiz. Du sprichst ${languageName} und hilfst Patienten bei ${useCaseText}. Du bist diskret, einfühlsam und respektvoll. Bei Terminanfragen fragst du nach dem Grund des Besuchs, dem gewünschten Datum und der bevorzugten Uhrzeit.`,
    'Dienstleistung': `Du bist ein professioneller, serviceorientierter Voice-Agent für ein ${industry}-Unternehmen in der Schweiz. Du sprichst ${languageName} und hilfst Kunden bei ${useCaseText}. Du bist zuverlässig, freundlich und lösungsorientiert. Bei Terminanfragen fragst du nach der gewünschten Dienstleistung, dem Datum und der Uhrzeit.`,
  };

  return industryPrompts[industry] || `Du bist ein professioneller Voice-Agent für ein ${industry}-Unternehmen in der Schweiz. Du sprichst ${languageName} und hilfst Kunden bei ${useCaseText}. Du bist freundlich, kompetent und serviceorientiert.`;
};

// Template-Generator-Funktion
const createTemplate = (
  id: string,
  name: string,
  description: string,
  language: string,
  languageCode: string,
  industry: string,
  useCase: string[],
  icon: string,
  goals: string[],
  openingHours: string = '24/7',
  recordingConsent: boolean = false
): AgentTemplate => {
  return {
    id,
    name,
    description,
    language,
    languageCode,
    industry,
    useCase,
    icon,
    systemPrompt: generateSystemPrompt(industry, languageCode, useCase),
    voiceId: VOICE_IDS[languageCode as keyof typeof VOICE_IDS] || VOICE_IDS['de-CH'],
    modelId: 'eleven_turbo_v2_5',
    defaultSettings: {
      recordingConsent,
      openingHours,
      goals,
    },
    tags: [language, industry, ...useCase],
  };
};

// Template-Definitionen
export const agentTemplates: AgentTemplate[] = [
  // Deutsch (Schweiz) Templates
  ...industries.map((industry) =>
    createTemplate(
      `de-ch-${industry.id}-appointment`,
      `${industry.label} - Terminbuchung`,
      `Professioneller Voice-Agent für ${industry.label} mit Fokus auf Terminbuchung`,
      'Deutsch (CH)',
      'de-CH',
      industry.value,
      ['Terminbuchung & Kalender'],
      '📅',
      ['Terminbuchung & Kalender'],
      '24/7',
      false
    )
  ),
  ...industries.map((industry) =>
    createTemplate(
      `de-ch-${industry.id}-support`,
      `${industry.label} - Support`,
      `Hilfreicher Voice-Agent für ${industry.label} mit Fokus auf Kunden-Support`,
      'Deutsch (CH)',
      'de-CH',
      industry.value,
      ['Support & FAQs'],
      '💬',
      ['Support & FAQs'],
      '24/7',
      false
    )
  ),
  ...industries.map((industry) =>
    createTemplate(
      `de-ch-${industry.id}-full`,
      `${industry.label} - Vollständig`,
      `Vollständiger Voice-Agent für ${industry.label} mit allen Funktionen`,
      'Deutsch (CH)',
      'de-CH',
      industry.value,
      ['Terminbuchung & Kalender', 'Lead-Qualifizierung', 'Support & FAQs'],
      '🚀',
      ['Terminbuchung & Kalender', 'Lead-Qualifizierung', 'Support & FAQs'],
      '24/7',
      false
    )
  ),

  // Französisch (Schweiz) Templates
  ...industries.slice(0, 4).map((industry) =>
    createTemplate(
      `fr-ch-${industry.id}-appointment`,
      `${industry.label} - Réservation`,
      `Agent vocal professionnel pour ${industry.label} avec focus sur la réservation`,
      'Français (CH)',
      'fr-CH',
      industry.value,
      ['Terminbuchung & Kalender'],
      '📅',
      ['Terminbuchung & Kalender'],
      '24/7',
      false
    )
  ),

  // Italienisch (Schweiz) Templates
  ...industries.slice(0, 3).map((industry) =>
    createTemplate(
      `it-ch-${industry.id}-appointment`,
      `${industry.label} - Prenotazione`,
      `Agente vocale professionale per ${industry.label} con focus su prenotazioni`,
      'Italiano (CH)',
      'it-CH',
      industry.value,
      ['Terminbuchung & Kalender'],
      '📅',
      ['Terminbuchung & Kalender'],
      '24/7',
      false
    )
  ),

  // Englisch Templates
  createTemplate(
    'en-us-service-full',
    'Service Business - Full Service',
    'Complete voice agent for service businesses with all features',
    'English (US)',
    'en-US',
    'Dienstleistung',
    ['Terminbuchung & Kalender', 'Lead-Qualifizierung', 'Support & FAQs'],
    '🚀',
    ['Terminbuchung & Kalender', 'Lead-Qualifizierung', 'Support & FAQs'],
    '24/7',
    false
  ),
  createTemplate(
    'en-gb-service-full',
    'Service Business - Full Service',
    'Complete voice agent for service businesses with all features',
    'English (UK)',
    'en-GB',
    'Dienstleistung',
    ['Terminbuchung & Kalender', 'Lead-Qualifizierung', 'Support & FAQs'],
    '🚀',
    ['Terminbuchung & Kalender', 'Lead-Qualifizierung', 'Support & FAQs'],
    '24/7',
    false
  ),
];

// Helper-Funktionen
export const getTemplateById = (id: string): AgentTemplate | undefined => {
  return agentTemplates.find(t => t.id === id);
};

export const getTemplatesByLanguage = (languageCode: string): AgentTemplate[] => {
  return agentTemplates.filter(t => t.languageCode === languageCode);
};

export const getTemplatesByIndustry = (industry: string): AgentTemplate[] => {
  return agentTemplates.filter(t => t.industry === industry);
};

export const getTemplatesByUseCase = (useCase: string): AgentTemplate[] => {
  return agentTemplates.filter(t => t.useCase.includes(useCase));
};

export const filterTemplates = (filters: {
  language?: string;
  industry?: string;
  useCase?: string;
}): AgentTemplate[] => {
  return agentTemplates.filter(t => {
    if (filters.language && t.languageCode !== filters.language) return false;
    if (filters.industry && t.industry !== filters.industry) return false;
    if (filters.useCase && !t.useCase.includes(filters.useCase)) return false;
    return true;
  });
};

// Verfügbare Filter-Optionen
export const availableLanguages = [
  { code: 'de-CH', label: 'Deutsch (CH)' },
  { code: 'fr-CH', label: 'Français (CH)' },
  { code: 'it-CH', label: 'Italiano (CH)' },
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
];

export const availableUseCases = [
  'Terminbuchung & Kalender',
  'Lead-Qualifizierung',
  'Support & FAQs',
  'Bestellannahme',
];


