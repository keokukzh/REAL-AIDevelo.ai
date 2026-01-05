import { PricingPlan } from '../types';

export const pricingPlans: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: '89',
    description: 'Perfekt für kleine Praxen & Salons',
    features: [
      'Bis zu 120 Anrufe / Monat – nie wieder verpasste Kundenanrufe',
      '1x Schweizer Telefonnummer (CH) – lokale Erreichbarkeit garantiert',
      'Automatische Terminbuchung direkt in Google/Outlook Kalender – keine Doppelbuchungen mehr',
      'Intelligente KI erkennt Terminwünsche und Rückrufanfragen automatisch',
      'Sofortige E-Mail-Benachrichtigungen bei wichtigen Anrufen',
      'DSG/DSGVO-konformer Vertrag – Datenschutz garantiert'
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
      'Bis zu 350 Anrufe / Monat – ideal für aktive Unternehmen mit hohem Anrufvolumen',
      '2x Schweizer Telefonnummern (CH) – für mehrere Standorte oder Abteilungen',
      'Maßgeschneiderte KI-Dialoge – passen Sie Gesprächsabläufe an Ihre Bedürfnisse an',
      'Voice Cloning mit Ihrer eigenen Stimme – authentische Kundenkommunikation',
      'Mehrsprachig: DE / EN (optional FR/IT) – perfekt für internationale Kunden',
      'Automatische SMS-Bestätigungen – reduzieren No-Shows um bis zu 80%',
      'Persönlicher Schweizer Support – E-Mail & optional Telefon direkt aus der Schweiz',
      'DSG/DSGVO-konformer Vertrag – vollständige Compliance garantiert'
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
      'Bis zu 800 Anrufe / Monat – für Unternehmen mit hohem Kundenkontakt',
      '3x Schweizer Telefonnummern (CH) – perfekt für Multi-Location-Betriebe',
      'Branchen-optimierte KI-Templates – vorkonfiguriert für Dental, Beauty, Handwerk & mehr',
      'Voice Cloning mit 2 Stimmen – verschiedene Ansprechpartner für verschiedene Bereiche',
      'Voll mehrsprachig: DE / FR / IT / EN – bedient alle Schweizer Sprachregionen',
      'API-Zugriff & CRM-Integration – automatische Lead-Übergabe an HubSpot, Salesforce & Co.',
      'Priority Support mit garantierten Antwortzeiten – Telefon & E-Mail',
      'Persönliche Onboarding-Session – wir richten alles für Sie ein'
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
      'Unbegrenzte Anrufe / Monat – skalieren Sie nach Bedarf',
      'Mehrere Agenten & Telefonnummern – für komplexe Organisationsstrukturen',
      'Maßgeschneiderte KI-Dialoge – entwickelt speziell für Ihre Anforderungen',
      'Dedizierter Account Manager – persönlicher Ansprechpartner für alle Belange',
      'SLA-Garantien & erweiterte Datenschutz-Optionen – inkl. Datenspeicherung ausschließlich in CH/EU'
    ],
    cta: 'Gespräch vereinbaren',
    priceNote: 'Individuelle Preisgestaltung',
  },
];
