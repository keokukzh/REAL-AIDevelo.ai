import { PricingPlan } from '../types';

export const pricingPlans: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: '89',
    description: 'Perfekt für kleine Praxen & Salons',
    features: [
      'Bis zu 120 Anrufe / Monat',
      '1x Schweizer Telefonnummer (CH)',
      'Terminbuchung & Kalender-Sync (Google / Outlook)',
      'Basis-KI-Dialoglogik für Termin & Rückruf',
      'E-Mail-Benachrichtigungen bei verpassten Anrufen',
      'Standard DSG/DSGVO-Vertrag'
    ],
    cta: 'Starter wählen',
    priceNote: 'inkl. Standard DSG/DSGVO-Vertrag',
  },
  {
    id: 'business',
    name: 'Business',
    price: '179',
    description: 'Für wachsende KMU & Vieltelefonierer',
    features: [
      'Bis zu 350 Anrufe / Monat',
      '2x Schweizer Telefonnummern (CH)',
      'Erweiterte KI-Dialoglogik (Custom Prompts)',
      'Voice Cloning (1 Stimme inklusive)',
      'Mehrsprachig: DE / EN (optional FR/IT vorbereiten)',
      'SMS-Bestätigungen inklusive (z.B. Terminbestätigung)',
      'Schweizer Support (E-Mail & optional Telefon)',
      'Standard DSG/DSGVO-Vertrag inklusive'
    ],
    cta: 'Business starten',
    highlight: true,
    badge: 'Meistgewählt',
    priceNote: 'inkl. Standard DSG/DSGVO-Vertrag',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '349',
    description: 'Für grössere Praxen & Gruppenpraxen',
    features: [
      'Bis zu 800 Anrufe / Monat',
      '3x Schweizer Telefonnummern (CH)',
      'Erweiterte KI-Logik mit Branchen-Templates (z.B. Dental, Beauty, Handwerk)',
      'Voice Cloning (2 Stimmen inklusive)',
      'Voll mehrsprachig: DE / FR / IT / EN',
      'API-Zugriff & CRM-Integration (bereit)',
      'Priorisierter Support (Telefon & E-Mail)',
      'Individuelle Onboarding-Session'
    ],
    cta: 'Premium starten',
    priceNote: 'inkl. Standard DSG/DSGVO-Vertrag',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Auf Anfrage',
    description: 'Für Callcenter, Franchise-Ketten & Spitäler',
    features: [
      '> 800 Anrufe / Monat',
      'Mehrere Agenten / Lines',
      'Custom KI-Dialogdesign',
      'Dedizierter Ansprechpartner',
      'SLA & spezielle Datenschutz-Optionen (z.B. Datenspeicherung CH/EU)'
    ],
    cta: 'Gespräch vereinbaren',
    priceNote: 'Individuelle Preisgestaltung',
  },
];
