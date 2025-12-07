import { PricingPlan } from '../types';

export const pricingPlans: PricingPlan[] = [
  {
    name: "Standard",
    price: 499,
    originalPrice: 799,
    features: [
      "24/7 Anrufannahme",
      "Terminbuchung in Echtzeit",
      "Schweizerdeutsche Mundart",
      "E-Mail Benachrichtigungen",
      "Basis Support"
    ],
    cta: "Jetzt starten"
  },
  {
    name: "Flash Deal",
    price: 599,
    originalPrice: 1497,
    features: [
      "Ewiger Rabatt (50% auf Monatsgebühr)",
      "3 Monate inklusive",
      "Priorisierter Support",
      "Custom Voice Cloning",
      "SMS & WhatsApp Integration",
      "Dashboard Zugang"
    ],
    cta: "Deal sichern",
    popular: true
  }
];
