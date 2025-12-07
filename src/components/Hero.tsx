import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Play, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/Button';
import { HeroBackground } from './hero/HeroBackground';
import { HeroPhone } from './hero/HeroPhone';

interface HeroProps {
  onStartOnboarding?: () => void;
  onScrollToSection?: (href: string) => void;
}

const ROTATING_TITLES = [
  "Schweizer KMU",
  "Friseure",
  "Garagen",
  "Zahnärzte",
  "Restaurants",
  "Immobilien"
];

export const Hero: React.FC<HeroProps> = ({ onStartOnboarding, onScrollToSection }) => {
  const { scrollY } = useScroll();
  const yContent = useTransform(scrollY, [0, 500], [0, 100]);
  const [titleIndex, setTitleIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTitleIndex((prev) => (prev + 1) % ROTATING_TITLES.length);
    }, 3000); // Rotate every 3 seconds
    return () => clearInterval(interval);
  }, []);

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
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-12">
      
      {/* Background */}
      <HeroBackground />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_90%)] -z-40 pointer-events-none" />

      {/* Main Container */}
      <div className="container mx-auto px-6 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            
            {/* Left Column: Text */}
            <motion.div 
              style={{ y: yContent }}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8 text-center lg:text-left"
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm shadow-lg hover:bg-slate-800/70 transition-colors cursor-default mx-auto lg:mx-0">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-semibold tracking-wide text-slate-300 uppercase">Jetzt live: Schweizerdeutsch v2.0</span>
              </div>
              
              {/* Heading with Rotating Text */}
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-display leading-tight tracking-tight drop-shadow-2xl text-white">
                KI-Mitarbeiter für <br />
                <div className="h-[1.2em] relative overflow-hidden text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-sky-400 animate-shimmer bg-[size:200%_auto]">
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={titleIndex}
                            initial={{ y: 40, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -40, opacity: 0 }}
                            transition={{ duration: 0.5, ease: "circOut" }}
                            className="absolute block w-full"
                        >
                            {ROTATING_TITLES[titleIndex]}
                        </motion.span>
                    </AnimatePresence>
                </div>
              </h1>
              
              {/* Subheading */}
              <div className="text-lg md:text-xl text-slate-300 max-w-xl leading-relaxed font-light mx-auto lg:mx-0">
                <p>Vergessen Sie verpasste Anrufe. Unsere KI nimmt ab, berät und bucht Termine – 24/7 in perfektem Schweizerdeutsch.</p>
              </div>

               {/* Benefits List (from screenshot idea) */}
               <div className="space-y-3 max-w-md mx-auto lg:mx-0">
                    <div className="flex items-center gap-3 text-slate-300 text-sm">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        <span>Versteht Schweizerdeutsch & Hochdeutsch</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-300 text-sm">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        <span>Erkennt Emotionen und Dringlichkeit</span>
                    </div>
                     <div className="flex items-center gap-3 text-slate-300 text-sm">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        <span>Kann unterbrochen werden (Full Duplex)</span>
                    </div>
               </div>


              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start pt-4">
                <Button onClick={scrollToDemo} variant="primary" className="bg-blue-600 hover:bg-blue-500 border-none text-white shadow-lg shadow-blue-900/40 px-8 py-6 text-lg" icon={<Play size={24} className="fill-current" />}>
                   Kostenlose Demo
                </Button>
                <Button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} variant="secondary" className="border-slate-600 hover:bg-slate-800/80 px-8 py-6 text-lg">
                  Preise ansehen
                </Button>
              </div>
            </motion.div>

            {/* Right Column: Hero Phone Visual */}
            <motion.div 
               initial={{ opacity: 0, scale: 0.9, x: 20 }}
               animate={{ opacity: 1, scale: 1, x: 0 }}
               transition={{ duration: 0.8, delay: 0.2 }}
               className="relative lg:h-[700px] flex items-center justify-center perspective-1000"
            >
                {/* Glow Effect behind Phone */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 rounded-full blur-[80px] -z-10" />
                
                <HeroPhone />

                {/* Floating Elements (Decorations) */}
                <motion.div 
                    animate={{ y: [0, -20, 0] }}
                    transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                    className="absolute top-20 right-10 bg-slate-800/80 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-xl hidden lg:block"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-mono text-slate-300">Termin gebucht: 14:30</span>
                    </div>
                </motion.div>

                <motion.div 
                    animate={{ y: [0, 20, 0] }}
                    transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-40 -left-10 bg-slate-800/80 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-xl hidden lg:block"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                        <span className="text-xs font-mono text-slate-300">Anruf transkribiert</span>
                    </div>
                </motion.div>

            </motion.div>

        </div>
      </div>
    </section>
  );
};
