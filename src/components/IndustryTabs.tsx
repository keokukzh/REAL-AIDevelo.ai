import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, Stethoscope, Car, Home, Wrench, Heart, Briefcase } from 'lucide-react';
import { Button } from './ui/Button';
import { IndustryDemoPreview } from './IndustryDemoPreview';
import { getIndustryDemo } from '../data/industryDemos';
import { RevealSection } from './layout/RevealSection';

interface IndustryTabsProps {
  onStartOnboarding?: (industry?: string) => void;
}

const industries = [
  {
    id: 'barber',
    label: 'Barber & Beauty',
    icon: Scissors,
    headline: "Der Stuhl ist voll, das Telefon klingelt.",
    problem: "Sie schneiden Haare und können nicht rangehen. Der Kunde ruft den nächsten Salon an.",
    solution: "Der Agent nimmt ab, kennt Ihre Preise und bucht den Schnitt direkt in Ihren Kalender.",
    sample: "«Guten Tag! Ja, für einen Fade-Cut am Freitag 14 Uhr habe ich noch was frei. Soll ich das eintragen?»"
  },
  {
    id: 'medical',
    label: 'Praxis & Medizin',
    icon: Stethoscope,
    headline: "Entlastung für Ihre MPA.",
    problem: "Patienten rufen wegen einfachen Terminen an und blockieren die Leitung für Notfälle.",
    solution: "Der Agent filtert Anliegen, bucht Routine-Termine und leitet Notfälle intelligent weiter.",
    sample: "«Dr. Müllers Praxis. Geht es um einen Notfall oder möchten Sie einen Kontrolltermin vereinbaren?»"
  },
  {
    id: 'auto',
    label: 'Garage & Kfz',
    icon: Car,
    headline: "Werkstattlärm vs. Telefon.",
    problem: "Sie liegen unter dem Auto. Jedes Mal Hände waschen fürs Telefon kostet 5 Minuten.",
    solution: "Der Agent nimmt Schadensmeldungen und Terminwünsche für Reifenwechsel auf.",
    sample: "«Garage Huber. Reifenwechsel? Gerne. Der nächste Slot ist am Dienstag um 09:00 Uhr.»"
  },
  {
    id: 'realestate',
    label: 'Immobilien',
    icon: Home,
    headline: "Besichtigung statt Telefonat.",
    problem: "Sie sind in einer Besichtigung. Interessenten für andere Objekte rufen an.",
    solution: "Der Agent qualifiziert den Interessenten: Budget, Lage, Dringlichkeit.",
    sample: "«Für das Objekt an der Seestrasse sende ich Ihnen gerne das Exposé per Mail zu. Haben Sie es erhalten?»"
  },
  {
    id: 'handwerk',
    label: 'Handwerk / Sanitär',
    icon: Wrench,
    headline: "Notfall-Service rund um die Uhr.",
    problem: "Kunden rufen nach Feierabend oder am Wochenende an. Sie verpassen wichtige Aufträge.",
    solution: "Der Agent erkennt Notfälle sofort, bucht Wartungstermine und nimmt Aufträge detailliert auf.",
    sample: "«Sanitär Meier. Handelt es sich um einen Notfall oder können wir einen Termin für nächste Woche vereinbaren?»"
  },
  {
    id: 'health',
    label: 'Ärzte / Gesundheit',
    icon: Heart,
    headline: "Patientenbetreuung ohne Wartezeit.",
    problem: "Die Praxis ist überlastet. Patienten warten lange auf einen Termin oder rufen mehrfach an.",
    solution: "Der Agent bucht Termine automatisch, beantwortet häufige Fragen und leitet Notfälle weiter.",
    sample: "«Praxis Dr. Weber. Möchten Sie einen Termin vereinbaren oder haben Sie eine Frage zu Ihrer Behandlung?»"
  },
  {
    id: 'service',
    label: 'Dienstleistung',
    icon: Briefcase,
    headline: "Professionelle Kundenbetreuung.",
    problem: "Sie sind im Außendienst oder bei Kunden. Anrufe gehen verloren oder werden nicht professionell behandelt.",
    solution: "Der Agent beantwortet Fragen, vereinbart Termine und leitet Anfragen intelligent weiter.",
    sample: "«Guten Tag! Wie kann ich Ihnen heute helfen? Ich kann Ihnen bei Terminvereinbarungen oder Fragen behilflich sein.»"
  }
];

export const IndustryTabs: React.FC<IndustryTabsProps> = ({ onStartOnboarding }) => {
  const [activeTab, setActiveTab] = useState(industries[0]);

  return (
    <RevealSection className="py-24 bg-black relative section-spacing" id="industries">
      <div className="container mx-auto px-6">
        <RevealSection className="text-center mb-12" staggerDelay={0.05}>
           <h2 className="text-3xl md:text-5xl font-bold font-display mb-4">Versteht <span className="text-accent">Ihr Business.</span></h2>
           <p className="text-gray-400">Keine generische Lösung. Wählen Sie Ihre Branche:</p>
        </RevealSection>

        {/* Tabs Navigation */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
            {industries.map((industry) => (
                <motion.button
                    key={industry.id}
                    onClick={() => setActiveTab(industry)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full border transition-all duration-300 ${
                        activeTab.id === industry.id 
                        ? 'bg-accent text-black border-accent shadow-[0_0_20px_rgba(0,224,255,0.4)]' 
                        : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                    }`}
                >
                    <industry.icon size={18} />
                    <span className="font-medium">{industry.label}</span>
                </motion.button>
            ))}
        </div>

        {/* Content Area with Demo Preview */}
        <AnimatePresence mode='wait'>
            <motion.div 
                key={activeTab.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-surface/30 border border-white/5 rounded-3xl p-8 md:p-12 backdrop-blur-sm"
            >
                {/* Problem/Solution Section */}
                <div className="mb-12 space-y-6">
                    <h3 className="text-3xl font-bold text-white">{activeTab.headline}</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex gap-4 items-start p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <div className="text-red-400 font-bold text-sm uppercase tracking-wide mt-1 min-w-[60px]">Problem</div>
                            <p className="text-gray-300 text-sm leading-relaxed">{activeTab.problem}</p>
                        </div>
                        <div className="flex gap-4 items-start p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                             <div className="text-green-400 font-bold text-sm uppercase tracking-wide mt-1 min-w-[60px]">Lösung</div>
                             <p className="text-gray-300 text-sm leading-relaxed">{activeTab.solution}</p>
                        </div>
                    </div>
                </div>

                {/* Demo Preview Section */}
                <div className="border-t border-white/10 pt-8">
                    <div className="mb-6 text-center">
                        <h4 className="text-2xl font-bold text-white mb-2">Live-Demo für {activeTab.label}</h4>
                        <p className="text-gray-400 text-sm">Hören Sie, wie der Agent in Ihrer Branche klingt</p>
                    </div>
                    
                    {(() => {
                        const demo = getIndustryDemo(activeTab.id);
                        if (demo) {
                            return (
                                <IndustryDemoPreview 
                                    key={`demo-${activeTab.id}`}
                                    demo={demo}
                                    onStartOnboarding={() => {
                                        onStartOnboarding?.(activeTab.id);
                                    }}
                                />
                            );
                        }
                        return null;
                    })()}
                </div>

                {/* CTA Button */}
                <div className="mt-8 text-center">
                    <Button 
                        variant="secondary" 
                        onClick={() => {
                            onStartOnboarding?.(activeTab.id);
                        }} 
                        className="px-8 py-3"
                    >
                        Agent für {activeTab.label} jetzt testen
                    </Button>
                </div>
            </motion.div>
        </AnimatePresence>
      </div>
    </RevealSection>
  );
};