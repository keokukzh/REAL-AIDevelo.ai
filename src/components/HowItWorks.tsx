import React from 'react';
import { motion } from 'framer-motion';
import { Settings, CalendarCheck, Zap } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      icon: Settings,
      title: "1. Agent konfigurieren",
      desc: "Wir richten den Voice Agent in 24h für Sie ein. Definieren Sie Tonalität und Wissen."
    },
    {
      icon: CalendarCheck,
      title: "2. Systeme verbinden",
      desc: "Nahtlose Integration mit Ihrem Google Kalender, Outlook oder CRM."
    },
    {
      icon: Zap,
      title: "3. Loslegen",
      desc: "Leiten Sie Ihre Anrufe um. Der Voice Agent übernimmt sofort 24/7."
    }
  ];

  return (
    <section className="py-24 bg-black relative z-10" id="how-it-works">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold font-display mb-4">In 3 Schritten zum <span className="text-primary">Autopiloten</span></h2>
          <p className="text-gray-400">Keine komplexe IT-Integration notwendig.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="relative p-8 rounded-2xl bg-surface/50 border border-white/5 hover:bg-surface hover:border-primary/30 transition-all duration-300 group"
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
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};