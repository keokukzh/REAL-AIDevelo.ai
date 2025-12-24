import React from 'react';
import { Settings, CalendarCheck, Zap } from 'lucide-react';
import { RevealSection } from '../layout/RevealSection';

export const VoiceHowItWorks: React.FC = () => {
  const steps = [
    {
      icon: Settings,
      title: "1. Agent konfigurieren",
      desc: "Wir richten Ihren Agent in 24h ein – Stimme, Skript, FAQ, gewünschte Sprachen."
    },
    {
      icon: CalendarCheck,
      title: "2. Systeme verbinden",
      desc: "Kalender (Google/Outlook/Calendly) und CRM werden angebunden – ohne IT-Aufwand."
    },
    {
      icon: Zap,
      title: "3. Live gehen",
      desc: "Leiten Sie Anrufe um, der Agent übernimmt 24/7: Termine setzen, Leads qualifizieren."
    }
  ];

  return (
    <RevealSection className="py-24 bg-black relative z-10 section-spacing" id="how-it-works">
      <div className="container mx-auto px-6">
        <RevealSection className="text-center mb-16" staggerDelay={0.05}>
          <h2 className="text-3xl md:text-5xl font-bold font-display mb-4">In 3 Schritten zum <span className="text-primary">Autopiloten</span></h2>
          <p className="text-gray-400">Keine komplexe IT-Integration notwendig.</p>
        </RevealSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative p-8 rounded-2xl bg-surface/50 border border-white/5 hover:bg-surface hover:border-primary/30 transition-all duration-300 group hover:-translate-y-2"
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-[1px] bg-gradient-to-r from-white/10 to-transparent z-0"></div>
              )}
              
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform duration-300">
                <step.icon size={32} />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
              <p className="text-gray-400">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </RevealSection>
  );
};