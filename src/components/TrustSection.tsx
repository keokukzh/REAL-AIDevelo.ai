import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Building2, Stethoscope, Scissors, Utensils, Wrench } from 'lucide-react';

const LogoItem: React.FC<{ Icon: any, name: string }> = ({ Icon, name }) => (
  <div className="flex items-center gap-2 text-gray-400 mx-8 hover:text-white transition-colors cursor-default">
    <Icon size={24} />
    <span className="text-lg font-semibold tracking-tight">{name}</span>
  </div>
);

export const TrustSection: React.FC = () => {
  const logos = [
    { Icon: Scissors, name: "Barbershop Zürich" },
    { Icon: Building2, name: "Meier Immobilien AG" },
    { Icon: Wrench, name: "Garage Auto-Fit Bern" },
    { Icon: Stethoscope, name: "Praxis Dr. med. Keller" },
    { Icon: Utensils, name: "Ristorante Ticino" },
    { Icon: Briefcase, name: "Consulting Group Basel" },
  ];

  return (
    <section className="py-12 border-y border-white/5 bg-black/50 backdrop-blur-sm relative z-20">
      <div className="container mx-auto px-6 mb-8 text-center">
        <p className="text-sm text-gray-500 uppercase tracking-widest">
          Bereits eingesetzt von modernen Unternehmen in der Schweiz
        </p>
      </div>
      
      <div className="relative flex overflow-hidden group">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />
        
        <motion.div 
          className="flex whitespace-nowrap"
          animate={{ x: [0, -1000] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        >
          {[...logos, ...logos, ...logos].map((logo, idx) => (
            <LogoItem key={idx} Icon={logo.Icon} name={logo.name} />
          ))}
        </motion.div>
      </div>
    </section>
  );
};