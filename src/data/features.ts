import { Feature } from '../types';
import { Phone, Calendar, Globe, Zap, Shield, PieChart } from 'lucide-react';

export const features: Feature[] = [
  {
    id: 1,
    title: "24/7 Erreichbarkeit",
    description: "Nie wieder einen Kunden verpassen. Ihr Agent nimmt jeden Anruf an – auch nachts und am Wochenende.",
    icon: Phone
  },
  {
    id: 2,
    title: "Termin-Automatik",
    description: "Der Agent bucht Termine direkt in Ihren Google oder Outlook Kalender. Keine Doppelbuchungen.",
    icon: Calendar
  },
  {
    id: 3,
    title: "Schweizer Mundart",
    description: "Versteht und spricht Schweizerdeutsch. Perfekt für lokale KMU und vertrauten Kundenkontakt.",
    icon: Globe
  },
  {
    id: 4,
    title: "Sofortige Antwort",
    description: "Keine Warteschleifen. Ihre Kunden erhalten sofortige Hilfe und Antworten auf ihre Fragen.",
    icon: Zap
  },
  {
    id: 5,
    title: "Datenschutz (nDSG)",
    description: "Hosting und Datenverarbeitung konform mit dem neuen Schweizer Datenschutzgesetz.",
    icon: Shield
  },
  {
    id: 6,
    title: "Analytics Dashboard",
    description: "Sehen Sie alle Anrufe, Transkripte und Terminbuchungen übersichtlich aufbereitet.",
    icon: PieChart
  }
];
