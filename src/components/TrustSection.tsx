import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Briefcase, Building2, Stethoscope, Scissors, Utensils, Wrench, Shield, CheckCircle2 } from 'lucide-react';
import { RevealSection } from './layout/RevealSection';
import { useReducedMotion as useReducedMotionHook } from '../hooks/useReducedMotion';
import { CountUp } from './ui/CountUp';

const LogoItem: React.FC<{ Icon: any, name: string }> = ({ Icon, name }) => (
  <div className="flex items-center gap-2 text-gray-400 mx-8 hover:text-white transition-colors cursor-default">
    <Icon size={24} />
    <span className="text-lg font-semibold tracking-tight">{name}</span>
  </div>
);

export const TrustSection: React.FC = () => {
  const [isMarqueePaused, setIsMarqueePaused] = useState(false);
  const prefersReducedMotion = useReducedMotionHook();
  
  const logos = [
    { Icon: Scissors, name: "Barbershop Zürich" },
    { Icon: Building2, name: "Meier Immobilien AG" },
    { Icon: Wrench, name: "Garage Auto-Fit Bern" },
    { Icon: Stethoscope, name: "Praxis Dr. med. Keller" },
    { Icon: Utensils, name: "Ristorante Ticino" },
    { Icon: Briefcase, name: "Consulting Group Basel" },
  ];

  const trustBadges = [
    { icon: Shield, text: 'DSGVO/nDSG-konform', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30', highlight: true },
    { icon: null, text: '🇨🇭 Made in Zürich', color: 'text-white', bg: 'bg-white/5', border: 'border-white/10', highlight: true },
    { icon: CheckCircle2, text: 'Hosting in der Schweiz', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    { icon: CheckCircle2, text: '14 Tage Geld-zurück-Garantie', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
    { icon: CheckCircle2, text: 'Monatlich kündbar', color: 'text-gray-300', bg: 'bg-white/5', border: 'border-white/10' },
    { icon: CheckCircle2, text: 'Schweizer Support', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
  ];

  return (
    <RevealSection className="py-16 border-y border-white/5 bg-black/50 backdrop-blur-sm relative z-20">
      <div className="container mx-auto px-6">
        {/* Trust Badges Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          {trustBadges.map((badge, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className={`flex flex-col items-center justify-center gap-2 px-4 py-4 rounded-xl border-2 ${badge.border} ${badge.bg} backdrop-blur-sm hover:scale-105 transition-transform ${badge.highlight ? 'ring-2 ring-offset-2 ring-offset-black ring-opacity-50' : ''}`}
            >
              {badge.icon ? (
                <badge.icon className={`w-6 h-6 ${badge.color} ${badge.highlight ? 'animate-pulse' : ''}`} />
              ) : (
                <span className="text-3xl">🇨🇭</span>
              )}
              <span className={`text-xs font-semibold text-center ${badge.color} leading-tight`}>
                {badge.text}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Social Proof */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm mb-4">
            <span className="text-2xl">🇨🇭</span>
            <span className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Made in Zürich</span>
          </div>
          <p className="text-sm text-gray-500 uppercase tracking-widest mb-2">
            Bereits eingesetzt von modernen Unternehmen in der Schweiz
          </p>
          <p className="text-lg font-semibold text-white">
            Bereits <span className="text-accent"><CountUp end={50} suffix="+" /> KMUs</span> vertrauen uns
          </p>
        </div>
      
        {/* Company Logos Carousel */}
        <div 
          className="relative flex overflow-hidden group"
          onMouseEnter={() => !prefersReducedMotion && setIsMarqueePaused(true)}
          onMouseLeave={() => setIsMarqueePaused(false)}
        >
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          
          <motion.div 
            className="flex whitespace-nowrap"
            animate={prefersReducedMotion || isMarqueePaused ? {} : { x: [0, -1000] }}
            transition={{ 
              duration: 30, 
              repeat: Infinity, 
              ease: "linear",
              repeatDelay: 0
            }}
          >
            {[...logos, ...logos, ...logos].map((logo, idx) => (
              <LogoItem key={idx} Icon={logo.Icon} name={logo.name} />
            ))}
          </motion.div>
        </div>
      </div>
    </RevealSection>
  );
};