import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Info, CheckCircle2, Zap } from 'lucide-react';
import { Button } from '../../ui/Button';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { isWebGLAvailable } from '../../../utils/webgl';
import { HeroUltraFallback } from './HeroUltraFallback';
import UltraScene from './UltraScene';

interface HeroUltraAnimationProps {
  t: {
    heroText1: string;
    heroText2: string;
    heroSub: string;
    missionStart: string;
    showSpecs: string;
    closeSpecs: string;
    scrollExplore: string;
  };
  lang: string;
}

const HeroUltraAnimation: React.FC<HeroUltraAnimationProps> = ({ t, lang }) => {
  const prefersReducedMotion = useReducedMotion();
  const [showSpecs, setShowSpecs] = useState(false);
  const [hasWebGL, setHasWebGL] = useState<boolean | null>(null);

  useEffect(() => {
    setHasWebGL(isWebGLAvailable());
  }, []);

  // Determine if we should show the full 3D experience
  const shouldRender3D = !prefersReducedMotion && hasWebGL === true;

  // Render the static fallback if 3D is not available or reduced motion is requested
  if (hasWebGL !== null && !shouldRender3D) {
    return <HeroUltraFallback t={t} onShowSpecs={() => setShowSpecs(!showSpecs)} showSpecs={showSpecs} />;
  }

  return (
    <section className="relative w-full h-[100vh] bg-slate-950 overflow-hidden flex items-center justify-center">
      {/* 3D WebGL Layer */}
      <div className="absolute inset-0 z-0">
        <Canvas gl={{ antialias: true, alpha: true }} dpr={[1, 2]}>
          <Suspense fallback={null}>
            <UltraScene />
          </Suspense>
        </Canvas>
      </div>

      {/* UI Content Layer - Identical to Fallback but floating over 3D */}
      <div className="container mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center pointer-events-none">
        
        {/* Left Content */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="pointer-events-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">Protocol Active // ULTRA_CORE</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black font-display text-white leading-[0.9] tracking-tighter mb-8 italic">
            {t.heroText1} <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 animate-gradient-x">
              {t.heroText2}
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 mb-10 max-w-xl font-light leading-relaxed">
            {t.heroSub}
          </p>

          <div className="flex flex-wrap gap-4">
             <Button 
               onClick={() => document.getElementById('process-flow')?.scrollIntoView({ behavior: 'smooth' })}
                className="h-16 px-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-none border-b-4 border-emerald-900 group"
                aria-label={t.missionStart}
             >
                <span className="flex items-center gap-2 font-bold uppercase tracking-widest text-sm">
                   {t.missionStart} <Zap size={18} className="text-yellow-300 group-hover:scale-110 transition-transform" />
                </span>
             </Button>

             <Button 
                onClick={() => setShowSpecs(!showSpecs)}
                variant="outline"
                className="h-16 px-10 rounded-none border-white/10 hover:bg-white/5 text-white backdrop-blur-sm"
                aria-label={showSpecs ? t.closeSpecs : t.showSpecs}
                aria-expanded={showSpecs}
             >
                <span className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest">
                   <Info size={16} /> {showSpecs ? t.closeSpecs : t.showSpecs}
                </span>
             </Button>
          </div>

          <div className="mt-12 flex items-center gap-8 text-[10px] font-mono text-gray-500">
             <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> ULTRA_PERFORMANT</div>
             <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-cyan-500" /> SCALABLE_CORE</div>
          </div>
        </motion.div>

        {/* Right side floating data */}
        <div className="hidden lg:block relative z-10">
           <AnimatePresence>
              {showSpecs && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, rotateY: 20 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  exit={{ opacity: 0, scale: 0.9, rotateY: 20 }}
                  className="bg-slate-900/40 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden group pointer-events-auto"
                >
                   <div className="absolute top-0 right-0 p-4 font-mono text-[8px] text-white/20">SYSTEM_LOG_V3.0</div>
                   <div className="space-y-6">
                      <div className="h-2 w-32 bg-emerald-500/20 rounded-full overflow-hidden">
                         <motion.div animate={{ x: [-128, 128] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} className="h-full w-1/2 bg-emerald-500" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="border border-white/5 p-4 rounded-xl">
                            <div className="text-[10px] text-gray-500 mb-1">FPS</div>
                            <div className="text-2xl font-mono font-bold text-white">120.0</div>
                         </div>
                         <div className="border border-white/5 p-4 rounded-xl">
                            <div className="text-[10px] text-gray-500 mb-1">LATENCY</div>
                            <div className="text-2xl font-mono font-bold text-emerald-400">0.01ms</div>
                         </div>
                      </div>
                      <code className="block p-4 bg-black/40 rounded-xl text-[10px] text-emerald-400 font-mono">
                         &gt; Initializing ULTRA protocol...<br/>
                         &gt; Quantum alignment active<br/>
                         &gt; Core stability 100% [OK]<br/>
                         &gt; UI_SYNC_COMPLETE
                      </code>
                   </div>
                </motion.div>
              )}
           </AnimatePresence>
        </div>
      </div>
      
      {/* Background Subtle Gradient Overlay for blend */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-950 via-transparent to-transparent z-1" />
    </section>
  );
};

export default HeroUltraAnimation;
