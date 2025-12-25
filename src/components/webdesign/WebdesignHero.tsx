import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue, AnimatePresence } from 'framer-motion';
import { ArrowRight, Code, Zap, Layout, Smartphone, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';

export const WebdesignHero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  // 3D Tilt Effect Logic
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = ({ clientX, clientY, currentTarget }: React.MouseEvent) => {
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    mouseX.set((clientX - left) / width - 0.5);
    mouseY.set((clientY - top) / height - 0.5);
  };

  const transformX = useSpring(useTransform(mouseX, [-0.5, 0.5], [15, -15]), { stiffness: 100, damping: 20 });
  const transformY = useSpring(useTransform(mouseY, [-0.5, 0.5], [15, -15]), { stiffness: 100, damping: 20 });

  const [showSpecs, setShowSpecs] = useState(false);

  return (
    <section 
      ref={containerRef} 
      className="relative min-h-[95vh] flex items-center justify-center pt-24 pb-12 overflow-visible"
      aria-label="Webdesign Services Intro"
    >
      {/* Content Container */}
      <div className="container mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Left Column: Typography & CTA */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-left relative z-20"
        >
          {/* Status Chip */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/40 border border-white/10 backdrop-blur-md mb-8 group hover:border-white/20 transition-colors cursor-default"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-mono font-medium text-emerald-400 tracking-wider uppercase group-hover:text-emerald-300 transition-colors">
              Systems Online & Ready
            </span>
          </motion.div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold font-display text-white leading-[0.95] tracking-tight mb-8">
            Digital <br/>
            <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 group/title">
              Genesis
              <motion.span 
                 className="absolute -bottom-2 left-0 w-full h-2 bg-swiss-red shadow-[0_5px_15px_-3px_rgba(218,41,28,0.5)]"
                 initial={{ scaleX: 0 }}
                 animate={{ scaleX: 1 }}
                 transition={{ delay: 0.8, duration: 1, ease: 'circOut' }}
                 style={{ originX: 0 }}
              />
              {/* Glitch Layers */}
              <span className="absolute inset-0 text-white opacity-0 group-hover/title:opacity-20 group-hover/title:animate-glitch-1 pointer-events-none select-none" aria-hidden="true">Genesis</span>
              <span className="absolute inset-0 text-red-500 opacity-0 group-hover/title:opacity-20 group-hover/title:animate-glitch-2 pointer-events-none select-none" aria-hidden="true">Genesis</span>
            </span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-gray-400 mb-10 max-w-xl leading-relaxed font-light">
            Wir transformieren Konzepte in <span className="text-white font-medium">digitale Dominanz</span>. Exzellenz ist kein Zufall, sondern Code.
          </p>

          <div className="flex flex-col sm:flex-row gap-5">
            <Button 
                onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
                variant="primary" 
                className="group relative overflow-hidden h-14 px-8 text-lg shadow-[0_0_40px_-10px_rgba(220,38,38,0.5)] hover:shadow-[0_0_60px_-10px_rgba(220,38,38,0.7)] transition-shadow duration-500"
            >
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_2s_infinite]" />
              <span className="relative z-10 flex items-center gap-3">
                Mission Starten <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>
            
            <Button 
                onClick={() => setShowSpecs(!showSpecs)}
                variant="outline" 
                className={`h-14 px-8 text-lg border border-white/10 backdrop-blur-sm transition-all duration-300 ${showSpecs ? 'bg-white/10 border-white/30 text-white' : 'hover:bg-white/5 text-gray-300'}`}
            >
              {showSpecs ? 'Analyse schließen' : 'Systemdaten ansehen'}
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 flex items-center gap-6 text-sm text-gray-500 font-mono">
             <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-blue-500" />
                <span>React Ecosystem</span>
             </div>
             <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-purple-500" />
                <span>High Performance</span>
             </div>
          </div>
        </motion.div>

        {/* Right Column: 3D Interactive Visuals */}
        <motion.div 
          style={{ y: y1 }}
          className="relative hidden lg:flex items-center justify-center perspective-[2000px] group"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => {
            mouseX.set(0);
            mouseY.set(0);
          }}
        >
          {/* 3D Container */}
          <motion.div
             style={{
               rotateY: transformX,
               rotateX: transformY,
             }}
             className="relative w-full max-w-[600px] aspect-[4/5] transition-transform duration-200 ease-out"
          >
             {/* Background Glow */}
             <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 via-purple-500/10 to-transparent rounded-[3rem] blur-[60px] transform translate-z-[-50px]" />

             {/* MAIN INTERFACE CARD */}
             <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col group/interface">
                {/* Header */}
                <div className="h-12 border-b border-white/5 flex items-center justify-between px-6 bg-white/5">
                   <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-rose-500/50" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                   </div>
                   <div className="flex gap-4 items-center">
                      <div className={`h-2 transition-all duration-500 ${showSpecs ? 'w-24 bg-blue-500/30' : 'w-16 bg-white/10'} rounded-full`} />
                      <Layout size={14} className="text-white/20" />
                   </div>
                </div>

                {/* Body Content: Mini Landing Page Mockup */}
                <div className="p-8 flex-1 flex flex-col gap-6 relative overflow-hidden">
                   {/* Blueprint Overlay */}
                   <AnimatePresence>
                      {showSpecs && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 z-20 bg-blue-900/10 backdrop-blur-[2px] pointer-events-none p-8"
                        >
                           <div className="w-full h-full border border-blue-500/30 border-dashed rounded-xl flex items-center justify-center">
                              <div className="text-[10px] font-mono text-blue-400/60 rotate-90 absolute right-4">GRID_SYSTEM_V1</div>
                              <div className="text-[10px] font-mono text-blue-400/60 absolute top-4 left-4">R: 255 G: 255 B: 255</div>
                           </div>
                        </motion.div>
                      )}
                   </AnimatePresence>

                   {/* Mockup Top Section */}
                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <div className="h-6 w-24 bg-white/10 rounded-md" />
                         <div className="flex gap-3">
                            <div className="h-2 w-8 bg-white/5 rounded-full" />
                            <div className="h-2 w-8 bg-white/5 rounded-full" />
                         </div>
                      </div>
                      
                      {/* Hero Image Mockup */}
                      <div className="w-full h-44 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 relative overflow-hidden shadow-inner group/mockup">
                         <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
                         <motion.div 
                           className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-swiss-red/10 rounded-full blur-3xl"
                           animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                           transition={{ duration: 4, repeat: Infinity }}
                         />
                         <div className="absolute bottom-6 left-6 space-y-2">
                            <div className="h-4 w-32 bg-white/20 rounded" />
                            <div className="h-2 w-48 bg-white/10 rounded" />
                         </div>
                         <div className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md rounded-lg border border-white/10">
                            <Zap size={14} className="text-yellow-400" />
                         </div>
                      </div>
                   </div>

                   {/* Content Rows */}
                   <div className="grid grid-cols-2 gap-4">
                      <div className="h-32 rounded-2xl bg-white/5 border border-white/5 p-4 flex flex-col justify-between">
                         <div className="w-8 h-8 rounded-lg bg-blue-500/20" />
                         <div className="space-y-2">
                            <div className="h-2 w-full bg-white/10 rounded" />
                            <div className="h-2 w-2/3 bg-white/10 rounded" />
                         </div>
                      </div>
                      <div className="h-32 rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col justify-end">
                         <div className="h-2 w-1/2 bg-white/20 rounded mb-2" />
                         <div className="h-8 w-full bg-white/10 rounded-lg group-hover/interface:bg-swiss-red/20 transition-all duration-300" />
                      </div>
                   </div>
                   
                   {/* Bottom Performance Stats */}
                   <div className="mt-auto grid grid-cols-3 gap-4 border-t border-white/5 pt-6">
                      {[
                        { label: 'Performance', val: '99', color: 'text-emerald-400' },
                        { label: 'Accessibility', val: '100', color: 'text-blue-400' },
                        { label: 'SEO', val: '96', color: 'text-purple-400' }
                      ].map((stat) => (
                         <div key={stat.label} className="text-center group/stat">
                            <motion.div 
                              className={`text-2xl font-bold font-mono ${stat.color} mb-1`}
                              animate={showSpecs ? { scale: [1, 1.1, 1] } : {}}
                            >
                              {stat.val}
                            </motion.div>
                            <div className="text-[8px] uppercase text-white/30 tracking-widest font-mono">{stat.label}</div>
                         </div>
                      ))}
                   </div>
                </div>
             </div>

             {/* FLOATING ELEMENTS */}
             
             {/* 1. Code Terminal with Typing Effect */}
             <motion.div 
               className="absolute -right-12 top-20 w-72 bg-[#1E1E1E]/95 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl p-5 font-mono text-[10px] z-30 overflow-hidden"
               animate={{ y: [0, -10, 0] }}
               transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
               style={{ translateZ: 60 }}
             >
                <div className="flex items-center justify-between mb-4 text-white/30 border-b border-white/5 pb-2">
                   <div className="flex items-center gap-2"><Code size={12} className="text-blue-400" /> <span>Component.tsx</span></div>
                   <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500/30" />
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/30" />
                   </div>
                </div>
                <div className="space-y-1">
                   <div className="text-white/40">// Professional Web Stack</div>
                   <div className="text-blue-300">
                      <span className="text-purple-400">const</span> <span className="text-yellow-200">Genesis</span> = () =&gt; (<br/>
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: '100%' }}
                        transition={{ duration: 2, ease: "linear", delay: 1.5 }}
                        className="overflow-hidden whitespace-nowrap border-r-2 border-blue-500"
                      >
                         <span className="pl-4 text-blue-400">&lt;Layout</span> <span className="text-emerald-400">spec</span>=<span className="text-amber-200">"AAA"</span> <span className="text-blue-400">/&gt;</span>
                      </motion.div>
                      <span className="text-blue-300">);</span>
                   </div>
                   <div className="mt-2 text-[9px] text-white/20 animate-pulse"># compiling_assets...</div>
                </div>
             </motion.div>

             {/* 2. Speed Metric Overlay */}
             <motion.div 
               className="absolute -left-16 bottom-24 w-60 bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 z-40 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
               animate={{ y: [0, 15, 0] }}
               transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
               style={{ translateZ: 100 }}
             >
                <div className="flex items-center gap-4 mb-4">
                   <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 shadow-inner">
                      <Zap size={20} fill="currentColor" />
                   </div>
                   <div>
                      <div className="text-sm font-bold text-white tracking-tight">Speed Master</div>
                      <div className="text-[10px] text-emerald-400/80 font-mono uppercase tracking-widest">Optimized</div>
                   </div>
                </div>
                <div className="space-y-2">
                   <div className="flex justify-between text-[10px] font-mono text-white/40">
                      <span>LCP</span>
                      <span className="text-emerald-400">0.8s</span>
                   </div>
                   <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden p-[2px]">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: '98%' }}
                        transition={{ duration: 1.5, delay: 0.5 }}
                        className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full shadow-[0_0_15px_rgba(52,211,153,0.5)]" 
                      />
                   </div>
                </div>
             </motion.div>

             {/* 3. Responsive Preview (Phone) */}
             <motion.div 
               className="absolute -right-8 -bottom-12 w-36 h-72 bg-slate-950 border-[6px] border-slate-900 rounded-[2.5rem] shadow-2xl z-30 overflow-hidden group/phone"
               animate={{ y: [0, -20, 0], rotate: [0, -3, 0] }}
               transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
               style={{ translateZ: 40 }}
             >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-slate-900 rounded-b-2xl z-20" />
                <div className="w-full h-full p-3 bg-slate-900/50 flex flex-col gap-3 relative">
                   <div className="w-full h-24 rounded-xl bg-gradient-to-br from-swiss-red/40 to-slate-800 border border-white/5 overflow-hidden">
                      <div className="w-full h-full bg-[url('/grid.svg')] opacity-10" />
                   </div>
                   <div className="space-y-2">
                      <div className="w-full h-2 bg-white/20 rounded" />
                      <div className="w-3/4 h-2 bg-white/10 rounded" />
                   </div>
                   <div className="mt-auto h-10 w-full rounded-xl bg-white/5 border border-white/5 flex items-center justify-center">
                      <Smartphone size={16} className="text-white/20" />
                   </div>
                   
                   {/* Scanning line for phone */}
                   <motion.div 
                     className="absolute top-0 left-0 w-full h-[2px] bg-swiss-red/50 shadow-[0_2px_10px_rgba(218,41,28,0.5)]"
                     animate={{ top: ['0%', '100%', '0%'] }}
                     transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                   />
                </div>
             </motion.div>

          </motion.div>
        </motion.div>

      </div>

      {/* Scroll Indicator */}
      <motion.div 
        style={{ opacity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        aria-hidden="true"
      >
        <span className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em]">Scroll to Explore</span>
        <motion.div 
          className="w-px h-12 bg-gradient-to-b from-swiss-red to-transparent"
          animate={{ height: ["0%", "100%", "0%"], opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </section>
  );
};
