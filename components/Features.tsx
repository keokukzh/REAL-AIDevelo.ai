import React from 'react';
import { motion } from 'framer-motion';
import { PhoneIncoming, Calendar, BarChart3, MessageSquare } from 'lucide-react';
import { Feature } from '../types';

const features: Feature[] = [
  {
    id: 1,
    title: "24/7 Erreichbarkeit",
    description: "Kein verpasster Anruf mehr. Ihr Agent arbeitet rund um die Uhr, auch an Feiertagen.",
    icon: PhoneIncoming
  },
  {
    id: 2,
    title: "Auto-Terminbuchung",
    description: "Vollständige Integration in Google Calendar, Outlook und CRM-Systeme.",
    icon: Calendar
  },
  {
    id: 3,
    title: "Lead-Qualifizierung",
    description: "Der Agent stellt intelligente Fragen, filtert Anfragen und priorisiert für Ihr Sales-Team.",
    icon: BarChart3
  },
  {
    id: 4,
    title: "Multichannel Support",
    description: "Nahtloser Übergang zwischen Telefon, SMS und WhatsApp für maximale Konversion.",
    icon: MessageSquare
  }
];

const FeatureCard: React.FC<{ feature: Feature; index: number }> = ({ feature, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className="group relative p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-accent/30 hover:bg-white/10 transition-all duration-300 backdrop-blur-md overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10">
        <div className="w-14 h-14 mb-6 rounded-xl bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform duration-300 shadow-lg">
          <feature.icon size={28} />
        </div>
        
        <h3 className="text-xl font-bold text-white mb-3 font-display">{feature.title}</h3>
        <p className="text-gray-400 leading-relaxed">{feature.description}</p>
      </div>
    </motion.div>
  );
};

export const Features: React.FC = () => {
  return (
    <section className="py-24 relative" id="features">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <motion.h2 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             className="text-3xl md:text-5xl font-bold font-display mb-6"
          >
            Mehr als nur ein <span className="text-accent">Anrufbeantworter</span>.
          </motion.h2>
          <motion.p 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ delay: 0.2 }}
             className="text-gray-400 text-lg"
          >
            Eine komplette KI-Mitarbeiterin, die Ihr Geschäft skaliert und Prozesse automatisiert.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={feature.id} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};