import React from 'react';
import { motion } from 'framer-motion';
import { Phone, Calendar, Users, TrendingUp, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { RevealSection } from '../layout/RevealSection';
import { Button } from '../ui/Button';

interface UseCase {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  before: string[];
  after: string[];
  industry: string;
}

const useCases: UseCase[] = [
  {
    id: 'lead-qualification',
    title: 'Lead-Qualifizierung',
    description: 'Automatische Qualifizierung von Interessenten – nur ernsthafte Kunden landen bei Ihnen',
    icon: Users,
    before: [
      'Anrufe gehen verloren außerhalb der Geschäftszeiten',
      'Manuelle Qualifizierung kostet Zeit',
      'Viele unqualifizierte Anfragen',
      'Keine strukturierte Erfassung',
    ],
    after: [
      '24/7 Erreichbarkeit – keine verpassten Anrufe',
      'Automatische Qualifizierung nach definierten Kriterien',
      'Nur qualifizierte Leads werden weitergeleitet',
      'Vollständige Erfassung im CRM',
    ],
    industry: 'Alle Branchen',
  },
  {
    id: 'appointment-booking',
    title: 'Terminbuchung',
    description: 'Automatische Terminbuchung direkt in Ihren Kalender – keine Doppelbuchungen mehr',
    icon: Calendar,
    before: [
      'Manuelle Terminvergabe am Telefon',
      'Doppelbuchungen durch Fehler',
      'Keine Verfügbarkeitsprüfung in Echtzeit',
      'Viele No-Shows ohne Erinnerung',
    ],
    after: [
      'Automatische Buchung in Google/Outlook',
      'Echtzeit-Verfügbarkeitsprüfung',
      'SMS-Erinnerungen reduzieren No-Shows um 80%',
      'Keine Doppelbuchungen mehr',
    ],
    industry: 'Praxen, Salons, Dienstleister',
  },
  {
    id: 'customer-service',
    title: 'Kundenservice',
    description: 'Sofortige Antworten auf häufige Fragen – auch nachts und am Wochenende',
    icon: Phone,
    before: [
      'Lange Wartezeiten in der Warteschleife',
      'Keine Erreichbarkeit außerhalb der Öffnungszeiten',
      'Wiederholte Standardfragen',
      'Unzufriedene Kunden durch lange Wartezeiten',
    ],
    after: [
      'Sofortige Antworten ohne Wartezeit',
      '24/7 Erreichbarkeit',
      'Automatische Beantwortung häufiger Fragen',
      'Höhere Kundenzufriedenheit',
    ],
    industry: 'E-Commerce, Services, Support',
  },
  {
    id: 'roi-tracking',
    title: 'ROI-Messung',
    description: 'Vollständige Transparenz über Anrufe, Leads und Conversions',
    icon: TrendingUp,
    before: [
      'Keine Übersicht über Anrufvolumen',
      'Schwierige ROI-Berechnung',
      'Keine Daten für Optimierung',
      'Unklare Conversion-Raten',
    ],
    after: [
      'Vollständiges Analytics-Dashboard',
      'Automatische ROI-Berechnung',
      'Daten für kontinuierliche Optimierung',
      'Klare Conversion-Tracking',
    ],
    industry: 'Marketing, Sales, Management',
  },
];

export const UseCasesSection: React.FC = () => {
  return (
    <RevealSection className="py-24 bg-gradient-to-b from-surface to-black relative overflow-hidden section-spacing">
      <div className="container mx-auto px-6 relative z-10">
        <RevealSection className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold font-display mb-6">
            So nutzen Schweizer KMUs <span className="text-accent">unseren Voice Agent</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Von der Lead-Qualifizierung bis zur Terminbuchung – sehen Sie, wie verschiedene Unternehmen von unserem Voice Agent profitieren.
          </p>
        </RevealSection>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-12">
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon;
            return (
              <motion.div
                key={useCase.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 hover:border-accent/30 transition-all hover:shadow-xl hover:shadow-accent/10"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-14 h-14 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center shrink-0">
                    <Icon size={28} className="text-accent" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">{useCase.title}</h3>
                    <p className="text-gray-400 text-sm mb-2">{useCase.description}</p>
                    <span className="inline-block px-3 py-1 rounded-full bg-slate-800 text-xs text-gray-400">
                      {useCase.industry}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <span className="text-xs font-semibold text-red-400 uppercase">Vorher</span>
                    </div>
                    <ul className="space-y-2">
                      {useCase.before.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-500">
                          <span className="text-red-500 mt-1">×</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span className="text-xs font-semibold text-emerald-400 uppercase">Nachher</span>
                    </div>
                    <ul className="space-y-2">
                      {useCase.after.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                          <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center">
          <Button
            variant="primary"
            onClick={() => {
              const demoSection = document.getElementById('demo');
              if (demoSection) {
                demoSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="px-8 py-4"
          >
            Live Demo ansehen
            <ArrowRight size={18} />
          </Button>
        </div>
      </div>
    </RevealSection>
  );
};

