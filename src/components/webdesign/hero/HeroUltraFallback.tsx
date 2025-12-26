import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Info, CheckCircle2, Zap } from 'lucide-react';
import { Button } from '../../ui/Button';

interface HeroUltraFallbackProps {
  t: {
    heroText1: string;
    heroText2: string;
    heroSub: string;
    missionStart: string;
    showSpecs: string;
    closeSpecs: string;
    scrollExplore: string;
  };
  onShowSpecs: () => void;
  showSpecs: boolean;
}

export const HeroUltraFallback: React.FC<HeroUltraFallbackProps> = ({ t, onShowSpecs, showSpecs }) => {
  return (
    <section className="relative w-full h-[100vh] bg-slate-950 overflow-hidden flex items-center justify-center">
      {/* Background Gradients simulating the 3D core */}
      <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] bg-emerald-500/10 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] max-w-[400px] max-h-[400px] bg-pink-600/10 rounded-full blur-[80px] animate-bounce-slow" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 bg-center" />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Left Content */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">Protocol Active // ULTRA_CORE</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black font-display text-white leading-[0.9] tracking-tighter mb-8 italic">
            {t.heroText1} <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500">
              {t.heroText2}
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 mb-10 max-w-xl font-light leading-relaxed">
            {t.heroSub}
          </p>

          <div className="flex flex-wrap gap-4">
             <Button 
                onClick={() => document.getElementById('webdesign-process')?.scrollIntoView({ behavior: 'smooth' })}
                className="h-16 px-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-none border-b-4 border-emerald-900 group transition-all"
             >
                <span className="flex items-center gap-2 font-bold uppercase tracking-widest text-sm">
                   {t.missionStart} <Zap size={18} className="text-yellow-300 group-hover:scale-110 transition-transform" />
                </span>
             </Button>

             <Button 
                onClick={onShowSpecs}
                variant="outline"
                className="h-16 px-10 rounded-none border-white/10 hover:bg-white/5 text-white backdrop-blur-sm"
             >
                <span className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest">
                   <Info size={16} /> {showSpecs ? t.closeSpecs : t.showSpecs}
                </span>
             </Button>
          </div>
        </motion.div>

        {/* Right side static visualization */}
         <div className="hidden lg:flex justify-center items-center relative">
            <div className="relative w-64 h-64 border border-white/10 rounded-full flex items-center justify-center animate-spin-slow">
                 <div className="absolute inset-0 border-t-2 border-emerald-500 rounded-full" />
                 <div className="w-48 h-48 border border-white/20 rounded-full flex items-center justify-center animate-reverse-spin">
                    <div className="w-32 h-32 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
                 </div>
            </div>
             
             {/* Specs Overlay */}
             <AnimatePresence>
              {showSpecs && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute top-0 right-0 lg:left-0 bg-slate-900/80 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl max-w-sm"
                >
                    <div className="text-xs font-mono text-emerald-400 mb-2">SYSTEM_STATUS: OPTIMAL</div>
                    <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden mb-4">
                        <div className="h-full bg-emerald-500 w-full animate-progress" />
                    </div>
                    <p className="text-sm text-gray-300">
                        High-performance fallback mode active. 
                        Visual fidelity optimized for accessibility.
                    </p>
                </motion.div>
              )}
           </AnimatePresence>
         </div>

      </div>
    </section>
  );
};
