export interface IndustryDemo {
  id: string;
  title: string;
  subtitle: string;
  audioFile?: string; // Optional: branchenspezifische Audio-Datei
  transcript: string; // Was der Agent sagt
  callerQuestion?: string; // Was der Anrufer fragt (optional)
  features: string[]; // Branchenspezifische Features
  icon?: string; // Emoji oder Icon für die Branche
}

export const industryDemos: Record<string, IndustryDemo> = {
  barber: {
    id: 'barber',
    title: 'Barber & Beauty',
    subtitle: 'Terminbuchung für Friseursalons',
    audioFile: '/audio/demo_de.mp3', // Fallback auf Standard-Audio
    transcript: 'Guten Tag! Hier ist der digitale Assistent von Salon Elegance. Möchten Sie einen Termin für einen Haarschnitt vereinbaren? Ich habe noch freie Slots am Freitag um 14:00 Uhr oder am Samstag um 10:00 Uhr.',
    callerQuestion: 'Hallo, ich hätte gerne einen Termin für einen Fade-Cut.',
    features: [
      'Terminbuchung direkt im Kalender',
      'Kennt Ihre Preise und Services',
      'Versteht Schweizerdeutsch',
      '24/7 verfügbar'
    ],
    icon: '✂️'
  },
  medical: {
    id: 'medical',
    title: 'Praxis & Medizin',
    subtitle: 'Entlastung für Ihre MPA',
    audioFile: '/audio/demo_de.mp3',
    transcript: 'Guten Tag! Hier ist der digitale Assistent von Dr. Müllers Praxis. Geht es um einen Notfall oder möchten Sie einen Kontrolltermin vereinbaren?',
    callerQuestion: 'Ich hätte gerne einen Termin für eine Kontrolle.',
    features: [
      'Filtert Notfälle von Routine-Terminen',
      'Bucht Kontrolltermine automatisch',
      'Leitet dringende Fälle weiter',
      'DSGVO-konform'
    ],
    icon: '🏥'
  },
  auto: {
    id: 'auto',
    title: 'Garage & Kfz',
    subtitle: 'Service-Anfragen und Terminbuchung',
    audioFile: '/audio/demo_de.mp3',
    transcript: 'Garage Huber, guten Tag! Wie kann ich Ihnen helfen? Möchten Sie einen Service-Termin vereinbaren oder haben Sie eine Schadensmeldung?',
    callerQuestion: 'Ich bräuchte einen Reifenwechsel.',
    features: [
      'Nimmt Schadensmeldungen auf',
      'Bucht Service-Termine',
      'Informiert über Wartezeiten',
      'Funktioniert auch bei Werkstattlärm'
    ],
    icon: '🔧'
  },
  realestate: {
    id: 'realestate',
    title: 'Immobilien',
    subtitle: 'Besichtigungstermine und Interessenten-Qualifizierung',
    audioFile: '/audio/demo_de.mp3',
    transcript: 'Guten Tag! Hier ist der digitale Assistent von Immobilien Zürich. Interessieren Sie sich für eine Besichtigung? Ich kann Ihnen gerne einen Termin vorschlagen oder das Exposé per E-Mail zusenden.',
    callerQuestion: 'Ich interessiere mich für die Wohnung an der Seestrasse.',
    features: [
      'Qualifiziert Interessenten',
      'Vereinbart Besichtigungstermine',
      'Sendet Exposés automatisch',
      'Erfasst Budget und Anforderungen'
    ],
    icon: '🏠'
  },
  handwerk: {
    id: 'handwerk',
    title: 'Handwerk / Sanitär',
    subtitle: 'Notfall-Service und Auftragsannahme',
    audioFile: '/audio/demo_de.mp3',
    transcript: 'Sanitär Meier, guten Tag! Handelt es sich um einen Notfall oder können Sie einen Termin für nächste Woche vereinbaren?',
    callerQuestion: 'Meine Heizung funktioniert nicht mehr.',
    features: [
      'Erkennt Notfälle sofort',
      'Bucht Wartungstermine',
      'Nimmt Aufträge detailliert auf',
      'Verfügbar auch nach Feierabend'
    ],
    icon: '🔨'
  },
  health: {
    id: 'health',
    title: 'Ärzte / Gesundheit',
    subtitle: 'Patientenbetreuung und Terminverwaltung',
    audioFile: '/audio/demo_de.mp3',
    transcript: 'Guten Tag! Hier ist der digitale Assistent der Praxis Dr. Weber. Möchten Sie einen Termin vereinbaren oder haben Sie eine Frage zu Ihrer Behandlung?',
    callerQuestion: 'Ich brauche einen Kontrolltermin.',
    features: [
      'Terminbuchung für Patienten',
      'Beantwortet häufige Fragen',
      'Leitet Notfälle weiter',
      'Vollständig DSGVO-konform'
    ],
    icon: '👨‍⚕️'
  },
  service: {
    id: 'service',
    title: 'Dienstleistung',
    subtitle: 'Allgemeine Kundenbetreuung',
    audioFile: '/audio/demo_de.mp3',
    transcript: 'Guten Tag! Hier ist der digitale Assistent. Wie kann ich Ihnen heute helfen? Ich kann Ihnen bei Terminvereinbarungen, Fragen zu unseren Services oder der Weiterleitung an einen Kollegen behilflich sein.',
    callerQuestion: 'Ich hätte eine Frage zu Ihrem Service.',
    features: [
      'Beantwortet Kundenfragen',
      'Vereinbart Termine',
      'Leitet Anfragen weiter',
      '24/7 erreichbar'
    ],
    icon: '💼'
  }
};

export const getIndustryDemo = (industryId: string): IndustryDemo | undefined => {
  return industryDemos[industryId];
};

export const getDefaultDemo = (): IndustryDemo => {
  return industryDemos.medical; // Fallback
};

