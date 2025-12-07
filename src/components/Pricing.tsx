import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, Zap, Star } from 'lucide-react';
import { Button } from './ui/Button';
import { pricingPlans } from '../data/pricing';

interface PricingProps {
  onStartOnboarding?: () => void;
}

const Countdown = () => {
  const [timeLeft, setTimeLeft] = useState({ hours: 47, minutes: 59, seconds: 59 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-2 text-red-400 font-mono text-sm bg-red-900/20 px-3 py-1 rounded-full border border-red-500/20">
      <Clock size={14} />
      <span>{String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}</span>
    </div>
  );
};

export const Pricing: React.FC<PricingProps> = ({ onStartOnboarding }) => {
  return (
    <section className="py-24 relative overflow-hidden" id="pricing">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold font-display mb-4">Ein Preis. <span className="text-accent">Alles inklusive.</span></h2>
          <p className="text-gray-400">Keine versteckten Kosten. Keine Agentur-Gebühren. Volle Leistung.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-center">
          
          {pricingPlans.map((plan, index) => {
             const isFlash = plan.popular;
             
             if (!isFlash) {
                 return (
                    <motion.div 
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="p-8 rounded-3xl bg-surface/30 border border-white/5 backdrop-blur-md flex flex-col items-center text-center opacity-60 hover:opacity-100 transition-opacity"
                    >
                        <h3 className="text-xl font-bold text-gray-300 mb-2">{plan.name}</h3>
                        <div className="text-4xl font-bold text-white mb-2">CHF {plan.price}<span className="text-sm text-gray-500 font-normal">/Monat</span></div>
                        <p className="text-sm text-gray-500 mb-6">Regulärer Preis</p>
                        
                        <ul className="space-y-3 mb-8 w-full text-left">
                            {plan.features.map((f, i) => (
                                <li key={i} className="flex items-center gap-3 text-gray-400 text-sm"><Check size={16} className="text-gray-600" /> {f.replace("Support", "Schweizer Support").replace("Setup", "Einrichtung")}</li>
                            ))}
                        </ul>
                        <Button variant="outline" className="w-full grayscale" disabled>{plan.cta}</Button>
                    </motion.div>
                 );
             } else {
                 return (
                    <motion.div 
                        key={index}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.02 }}
                        viewport={{ once: true }}
                        className="relative p-10 rounded-3xl bg-gradient-to-b from-gray-800 to-black border-2 border-accent shadow-[0_0_80px_rgba(0,224,255,0.2)] flex flex-col transform md:scale-110 z-10"
                    >
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-accent text-black font-bold px-6 py-2 rounded-full text-sm shadow-lg shadow-accent/40 whitespace-nowrap flex items-center gap-2">
                        <Zap size={16} fill="currentColor" /> FLASH DEAL
                        </div>

                        <div className="flex justify-between items-start mb-6 pt-4">
                            <div className="text-left">
                            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                                {plan.name} <Star size={16} className="text-yellow-400 fill-yellow-400" />
                            </h3>
                            <p className="text-accent text-sm mt-1">Exklusives Eröffnungsangebot (Schweiz)</p>
                            </div>
                            <Countdown />
                        </div>
                        
                        <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10 text-left">
                            <div className="text-sm text-gray-400 mb-1">Komplettpreis (3 Monate):</div>
                            <div className="flex items-center gap-3">
                                <span className="text-5xl font-bold text-white">CHF {plan.price}</span>
                                <div className="flex flex-col text-left">
                                    <span className="text-sm text-gray-500 line-through">statt CHF {plan.originalPrice}</span>
                                    <span className="text-green-400 text-xs font-bold">Sie sparen 60%</span>
                                </div>
                            </div>
                        </div>

                        <ul className="space-y-4 mb-8 flex-1 text-left">
                            <p className="text-sm text-white font-semibold border-b border-white/10 pb-2">Alles inklusive für Ihren Erfolg:</p>
                        {plan.features.map((f, i) => (
                            <li key={i} className="flex items-start gap-3 text-white text-sm">
                            <div className="min-w-5 h-5 rounded-full bg-accent flex items-center justify-center text-black mt-0.5 shadow-[0_0_10px_rgba(0,224,255,0.5)]">
                                <Check size={12} strokeWidth={3} />
                            </div>
                            {f}
                            </li>
                        ))}
                        </ul>
                        
                        <Button variant="primary" onClick={onStartOnboarding} className="w-full bg-accent text-black hover:bg-accent/90 shadow-[0_0_30px_rgba(0,224,255,0.4)] py-4 text-lg">
                            {plan.cta}
                        </Button>
                        <p className="text-xs text-center text-gray-500 mt-4">30 Tage Geld-zurück-Garantie. Keine Vertragsbindung.</p>
                    </motion.div>
                 );
             }
          })}

        </div>
        
        <div className="mt-16 text-center">
             <p className="text-gray-500 text-sm">Für Franchise-Nehmer & Großunternehmen:</p>
             <button onClick={() => window.location.href = "mailto:enterprise@aidevelo.ai"} className="text-white hover:text-accent underline underline-offset-4 mt-2 text-sm transition-colors">
                 Enterprise Lösungen anfragen
             </button>
        </div>

      </div>
    </section>
  );
};