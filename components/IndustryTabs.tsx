import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, Stethoscope, Car, Home, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/Button';

interface IndustryTabsProps {
  onStartOnboarding?: () => void;
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
  }
];

export const IndustryTabs: React.FC<IndustryTabsProps> = ({ onStartOnboarding }) => {
  const [activeTab, setActiveTab] = useState(industries[0]);

  return (
    <section className="py-24 bg-black relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
           <h2 className="text-3xl md:text-5xl font-bold font-display mb-4">Versteht <span className="text-accent">Ihr Business.</span></h2>
           <p className="text-gray-400">Keine generische Lösung. Wählen Sie Ihre Branche:</p>
        </div>

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

        {/* Content Area */}
        <AnimatePresence mode='wait'>
            <motion.div 
                key={activeTab.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center bg-surface/30 border border-white/5 rounded-3xl p-8 md:p-12 backdrop-blur-sm"
            >
                <div className="space-y-6">
                    <h3 className="text-3xl font-bold text-white">{activeTab.headline}</h3>
                    
                    <div className="space-y-4">
                        <div className="flex gap-4 items-start p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <div className="text-red-400 font-bold text-sm uppercase tracking-wide mt-1">Problem</div>
                            <p className="text-gray-300 text-sm leading-relaxed">{activeTab.problem}</p>
                        </div>
                        <div className="flex gap-4 items-start p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                             <div className="text-green-400 font-bold text-sm uppercase tracking-wide mt-1">Lösung</div>
                             <p className="text-gray-300 text-sm leading-relaxed">{activeTab.solution}</p>
                        </div>
                    </div>

                    <Button variant="secondary" onClick={onStartOnboarding} className="mt-4">
                        Agent für {activeTab.label} testen
                    </Button>
                </div>

                <div className="relative">
                    {/* Chat Bubble Visual */}
                    <div className="absolute -inset-4 bg-gradient-to-r from-accent/20 to-primary/20 rounded-full blur-2xl opacity-50" />
                    
                    <div className="relative bg-black border border-white/10 rounded-2xl p-6 shadow-2xl">
                        <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-black font-bold">AI</div>
                            <div>
                                <div className="font-bold text-white">AIDevelo Agent</div>
                                <div className="text-xs text-accent">Spricht gerade...</div>
                            </div>
                        </div>
                        
                        <div className="text-lg md:text-xl font-medium text-gray-200 leading-relaxed italic">
                            "{activeTab.sample}"
                        </div>

                        <div className="mt-6 flex gap-2">
                             {[1,2,3].map(i => (
                                 <div key={i} className="h-1 flex-1 bg-accent/30 rounded-full animate-pulse" style={{ animationDelay: `${i*0.2}s`}} />
                             ))}
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};