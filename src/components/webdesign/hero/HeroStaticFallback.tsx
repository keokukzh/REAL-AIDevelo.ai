import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Info, CheckCircle2 } from 'lucide-react';
import { Button } from '../../ui/Button';

interface HeroStaticFallbackProps {
  t: any;
  onShowSpecs: () => void;
  showSpecs: boolean;
}

export const HeroStaticFallback: React.FC<HeroStaticFallbackProps> = ({ t, onShowSpecs, showSpecs }) => {
  return (
    <div className="absolute inset-0 bg-slate-950 overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
      
      {/* Animated Gradient Orbs (CSS-only simulations of the 3D core) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/20 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-600/10 rounded-full blur-[80px] animate-bounce-slow" />

      {/* Content Container (Matches 3D Layout) */}
      <div className="container mx-auto px-6 relative z-10 h-full flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">
          
          {/* Left Content Column */}
          <div className="pointer-events-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6">
               <span className="w-2 h-2 rounded-full bg-emerald-500" />
               <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">System Online // Static Mode</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black font-display text-white leading-[0.9] tracking-tighter mb-8 italic">
              {t.heroText1} <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-purple-500 to-blue-500">
                {t.heroText2}
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-400 mb-10 max-w-xl font-light leading-relaxed">
              {t.heroSub}
            </p>

            <div className="flex flex-wrap gap-4">
               <Button 
                  onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
                  className="h-16 px-10 bg-red-600 hover:bg-red-700 text-white rounded-none border-b-4 border-red-900 group"
               >
                  <span className="flex items-center gap-2 font-bold uppercase tracking-widest text-sm">
                     {t.missionStart} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
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

            <div className="mt-12 flex items-center gap-8 text-[10px] font-mono text-gray-500">
               <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-red-500" /> HIGH_FIDELITY</div>
               <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-purple-500" /> ACCESSIBLE_CORE</div>
            </div>
          </div>

          {/* Right Column - Data/Specs Panel */}
          {showSpecs && (
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="hidden lg:block bg-slate-900/40 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden"
            >
               <div className="absolute top-0 right-0 p-4 font-mono text-[8px] text-white/20">SYSTEM_LOG_STATIC</div>
               <div className="space-y-6">
                  <div className="h-2 w-32 bg-red-500/20 rounded-full overflow-hidden">
                     <div className="h-full w-full bg-red-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="border border-white/5 p-4 rounded-xl">
                        <div className="text-[10px] text-gray-500 mb-1">MODE</div>
                        <div className="text-xl font-mono font-bold text-white">REDUCED_MOTION</div>
                     </div>
                     <div className="border border-white/5 p-4 rounded-xl">
                        <div className="text-[10px] text-gray-500 mb-1">LATENCY</div>
                        <div className="text-xl font-mono font-bold text-emerald-400">0.00ms</div>
                     </div>
                  </div>
                  <code className="block p-4 bg-black/40 rounded-xl text-[10px] text-blue-400 font-mono">
                     &gt; Fallback protocol active<br/>
                     &gt; WebGL bypassed<br/>
                     &gt; Accessibility priority: HIGH<br/>
                  </code>
               </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
};
