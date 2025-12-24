import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate } from 'framer-motion';
import { ArrowRight, Code, Zap, Globe, Layout, Smartphone, CheckCircle2 } from 'lucide-react';
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

  const transformX = useTransform(mouseX, [-0.5, 0.5], [15, -15]);
  const transformY = useTransform(mouseY, [-0.5, 0.5], [15, -15]);

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
            <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
              Genesis
              <motion.span 
                 className="absolute -bottom-2 left-0 w-full h-2 bg-swiss-red"
                 initial={{ scaleX: 0 }}
                 animate={{ scaleX: 1 }}
                 transition={{ delay: 0.8, duration: 1, ease: 'circOut' }}
                 style={{ originX: 0 }}
              />
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
                onClick={() => document.getElementById('website-previews')?.scrollIntoView({ behavior: 'smooth' })}
                variant="outline" 
                className="h-14 px-8 text-lg border border-white/10 hover:bg-white/5 backdrop-blur-sm"
            >
              Systemdaten ansehen
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
             <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="h-12 border-b border-white/5 flex items-center justify-between px-6 bg-white/5">
                   <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-rose-500/50" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                   </div>
                   <div className="flex gap-4">
                      <div className="h-2 w-16 bg-white/10 rounded-full" />
                      <div className="h-2 w-8 bg-white/10 rounded-full" />
                   </div>
                </div>

                {/* Body Content */}
                <div className="p-8 flex-1 flex flex-col gap-6 relative">
                   {/* Abstract Hero Image inside Card */}
                   <div className="w-full h-40 rounded-xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-white/5 relative overflow-hidden group/card shadow-inner">
                      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-30" />
                      <motion.div 
                        initial={{ width: '0%' }}
                        whileInView={{ width: '100%' }}
                        transition={{ duration: 1.5, ease: "circOut", delay: 1 }}
                        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500" 
                      />
                      <div className="absolute top-4 left-4 p-2 bg-black/50 backdrop-blur rounded-lg">
                         <Globe size={20} className="text-white/70" />
                      </div>
                   </div>

                   {/* Content Blocks */}
                   <div className="space-y-4">
                      <div className="flex gap-4">
                         <div className="h-24 flex-1 rounded-xl bg-white/5 border border-white/5 animate-pulse" style={{ animationDuration: '3s' }} />
                         <div className="h-24 w-24 rounded-xl bg-white/5 border border-white/5" />
                      </div>
                      <div className="h-4 w-3/4 rounded bg-white/5" />
                      <div className="h-4 w-1/2 rounded bg-white/5" />
                   </div>
                   
                   {/* Bottom Stats */}
                   <div className="mt-auto grid grid-cols-3 gap-4 border-t border-white/5 pt-6">
                      {[1,2,3].map((i) => (
                         <div key={i} className="text-center">
                            <div className="text-2xl font-bold text-white/90 font-mono">9{i}%</div>
                            <div className="text-[10px] uppercase text-white/30 tracking-wider">Metrics</div>
                         </div>
                      ))}
                   </div>
                </div>
             </div>

             {/* FLOATING ELEMENTS (Parallax) */}
             
             {/* 1. Code Terminal */}
             <motion.div 
               className="absolute -right-8 top-20 w-64 bg-[#1E1E1E] rounded-xl border border-white/10 shadow-xl p-4 font-mono text-xs z-20"
               animate={{ y: [0, -10, 0] }}
               transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
               style={{ translateZ: 50 }}
             >
                <div className="flex items-center justify-between mb-3 text-white/30 border-b border-white/5 pb-2">
                   <div className="flex items-center gap-2"><Code size={12} /> <span>config.tsx</span></div>
                   <span>TSX</span>
                </div>
                <div className="text-blue-300">
                   <span className="text-purple-400">const</span> <span className="text-yellow-200">Agency</span> = &#123;<br/>
                   &nbsp;&nbsp;performance: <span className="text-emerald-400">'100/100'</span>,<br/>
                   &nbsp;&nbsp;design: <span className="text-emerald-400">'Premium'</span>,<br/>
                   &nbsp;&nbsp;status: <span className="text-emerald-400">'Online'</span><br/>
                   &#125;;
                </div>
             </motion.div>

             {/* 2. Performance Metric Card */}
             <motion.div 
               className="absolute -left-12 bottom-32 w-56 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 z-30 shadow-2xl"
               animate={{ y: [0, 15, 0] }}
               transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
               style={{ translateZ: 80 }}
             >
                <div className="flex items-center gap-3 mb-3">
                   <div className="p-2 rounded-lg bg-green-500/20 text-green-400">
                      <Zap size={18} fill="currentColor" />
                   </div>
                   <div>
                      <div className="text-sm font-semibold text-white">Speed Index</div>
                      <div className="text-xs text-green-400 font-mono">0.4s Fast</div>
                   </div>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }}
                     whileInView={{ width: '98%' }}
                     transition={{ duration: 1.5, delay: 0.5 }}
                     className="h-full bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" 
                   />
                </div>
             </motion.div>

             {/* 3. Mobile Preview Float */}
             <motion.div 
               className="absolute -right-4 -bottom-8 w-32 h-64 bg-slate-900 border-4 border-slate-800 rounded-[2rem] shadow-xl z-20 overflow-hidden"
               animate={{ y: [0, -20, 0], rotate: [0, -5, 0] }}
               transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
               style={{ translateZ: 30 }}
             >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-slate-800 rounded-b-lg z-10" />
                <div className="w-full h-full bg-white/5 flex flex-col gap-2 p-2 pt-6">
                   <div className="w-full aspect-video rounded bg-white/10" />
                   <div className="w-3/4 h-2 rounded bg-white/10" />
                   <div className="w-1/2 h-2 rounded bg-white/10" />
                   <div className="mt-auto w-full h-8 rounded-full bg-blue-500/20" />
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
