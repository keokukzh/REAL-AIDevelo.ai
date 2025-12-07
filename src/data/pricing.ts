import { Plan } from '../types';

export const pricingPlans: Plan[] = [
  {
    name: 'Starter',
    price: '290',
    originalPrice: '390',
    description: 'Perfekt für kleine Praxen & Salons',
    features: [
      'Bis zu 100 Anrufe/Monat',
      '1x Telefonnummer (CH)',
      'Terminbuchung & Kalender-Sync',
      'Schweizer Support (Email)',
      'Standard DSGVO-Vertrag',
      'Einrichtung: CHF 250 (Einmalig)'
    ],
    cta: 'Starter wählen',
    popular: false,
  },
  {
    name: 'Professional',
    price: '590',
    originalPrice: '790',
    description: 'Für wachsende KMU & Vieltelefonierer',
    features: [
      'Unlimitierte Anrufe',
      '2x Telefonnummern (CH)',
      'Erweiterte KI-Logik (Custom Prompts)',
      'Priorisierter Support (Tel & Email)',
      'SMS-Bestätigungen inklusive',
      'Einrichtung: KOSTENLOS (Limited)'
    ],
    cta: 'Professional starten',
    popular: true,
  },
];
