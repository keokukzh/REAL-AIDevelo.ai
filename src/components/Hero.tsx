import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Play } from 'lucide-react';
import { Button } from './ui/Button';
import { HeroVisualization } from './hero/HeroVisualization';

const TypewriterText = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let index = 0;
    const intervalId = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(index));
      index++;
      if (index === text.length) clearInterval(intervalId);
    }, 50);
    return () => clearInterval(intervalId);
  }, [text]);

  return <span>{displayedText}<span className="animate-pulse text-accent">|</span></span>;
};

interface HeroProps {
  onStartOnboarding?: () => void;
  onScrollToSection?: (href: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onStartOnboarding, onScrollToSection }) => {
  const { scrollY } = useScroll();
  
  // Subtle Parallel Background Effects
  const yBlobPrimary = useTransform(scrollY, [0, 1000], [0, 300]); 
  const yBlobAccent = useTransform(scrollY, [0, 1000], [0, 200]);

  const scrollToDemo = () => {
    const demoSection = document.getElementById('demo');
    if (demoSection) {
        const headerOffset = 80;
        const elementPosition = demoSection.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
        });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 bg-[#020617]">
      
      {/* --- Optimized Background Layer --- */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 -z-50" />
      
      {/* Animated Blobs */}
      <div className="absolute inset-0 overflow-hidden -z-40 pointer-events-none opacity-40">
         <motion.div 
            style={{ y: yBlobPrimary }}
            className="absolute -top-[10%] -left-[10%] w-[700px] h-[700px] rounded-full blur-[120px] bg-blue-900/20" 
         />
         <motion.div 
            style={{ y: yBlobAccent }}
            className="absolute -bottom-[10%] -right-[10%] w-[600px] h-[600px] rounded-full blur-[100px] bg-cyan-900/20" 
         />
      </div>

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] -z-20 pointer-events-none" />

      {/* --- Main Content --- */}
      <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        
        {/* Left Column: Text Content */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm shadow-lg mb-6">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold tracking-wide text-slate-300 uppercase">Jetzt live: Schweizerdeutsch v2.0</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold font-display leading-tight tracking-tight drop-shadow-xl mb-6 text-white">
            KI-Telefonanruf-Agent, <br />
            der Ihre Termine bucht.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300 drop-shadow-md">24/7 in Schweizerdeutsch.</span>
          </h1>
          
          <div className="text-xl text-slate-300 max-w-lg leading-relaxed mb-8 font-light">
            <p className="mb-2">Automatisieren Sie 80% Ihrer eingehenden Anrufe.</p>
            <p>Kostenlose Demo in unter 2 Min.</p>
          </div>

          {/* Industry Quick Nav */}
          <div className="flex flex-wrap gap-2 mb-8">
             {['Friseur', 'Zahnarzt', 'Restaurant', 'Handwerk'].map((industry) => (
                <button 
                  key={industry}
                  onClick={() => {
                      const section = document.getElementById('industries');
                      section?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-800/40 border border-slate-700/50 hover:bg-slate-700/50 hover:border-sky-500/30 text-xs text-slate-200 transition-all flex items-center gap-2 font-medium"
                >
                   {industry === 'Friseur' && '✂️'}
                   {industry === 'Zahnarzt' && '🦷'}
                   {industry === 'Restaurant' && '🍽️'}
                   {industry === 'Handwerk' && '🔧'}
                   {industry}
                </button>
             ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={scrollToDemo} variant="primary" className="bg-blue-600 hover:bg-blue-500 border-none text-white shadow-lg shadow-blue-900/40" icon={<Play size={20} className="fill-current" />}>
               Kostenlose Agent-Demo
            </Button>
            <Button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} variant="secondary" className="border-slate-600 hover:bg-slate-800">
              Pricing ansehen
            </Button>
          </div>
          
          {/* Trust Bar */}
          <div className="mt-10 pt-6 border-t border-slate-800/50">
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-[11px] md:text-xs text-slate-400 font-semibold uppercase tracking-wide">
                <span className="flex items-center gap-1.5"><span className="text-red-500 text-sm">🇨🇭</span> Schweizer Server & DSG-konform</span>
                <span className="flex items-center gap-1.5">🔒 DSGVO certified</span>
                <span className="flex items-center gap-1.5">⚡ 99.9% Verfügbarkeit</span>
                <span className="flex items-center gap-1.5">💬 24/7 Support</span>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Visual Content - New Voice Console */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative flex justify-center items-center py-10 lg:py-0"
        >
           {/* Glow behind the console */}
           <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/10 to-transparent rounded-full blur-[80px] pointer-events-none" />
           
           <HeroVisualization />
           
        </motion.div>
      </div>
    </section>
  );
};