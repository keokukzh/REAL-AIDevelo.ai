import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import { ArrowRight, Code, Palette, Zap, MousePointer2 } from 'lucide-react';
import { Button } from '../ui/Button';

export const WebdesignHero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Parallax effects
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const y2 = useTransform(scrollY, [0, 500], [0, -150]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);

  // Floating animation for elements - inlined to avoid type issues

  return (
    <div ref={containerRef} className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-slate-950 pt-20">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-slate-950">
        <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-blue-900/20 via-slate-950/50 to-slate-950" />
        {/* Animated Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)] opacity-30" />
        
        {/* Glowing Orbs */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" 
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 5 }}
          className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2" 
        />
      </div>

      <div className="container mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* Text Content */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-left"
        >
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-6"
          >
            <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
            <span className="text-xs font-medium text-gray-300 tracking-wide uppercase">Verfügbar für neue Projekte</span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-bold font-display text-white leading-tight mb-6">
            Wir bauen <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 animate-gradient-x">
              Digitale Erlebnisse
            </span>
          </h1>
          
          <p className="text-xl text-gray-400 mb-8 max-w-xl leading-relaxed">
            Verwandeln Sie Besucher in Kunden mit Websites, die nicht nur gut aussehen, sondern performen. <span className="text-white font-medium">Schweizer Präzision trifft auf modernes Design.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
                onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
                variant="primary" 
                className="group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Projekt starten <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Button>
            
            <Button 
                onClick={() => document.getElementById('website-previews')?.scrollIntoView({ behavior: 'smooth' })}
                variant="outline" 
            >
              Portfolio ansehen
            </Button>
          </div>
        </motion.div>

        {/* Visual Content - "Digital Genesis" */}
        <motion.div 
          style={{ y: y1 }}
          className="relative h-[500px] w-full hidden lg:block"
        >
          {/* Main Floating Card - Completed UI */}
          <motion.div 
            animate={{
              y: [0, -20, 0]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[500px] bg-slate-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden z-20 group"
          >
            {/* Window Controls */}
            <div className="h-8 bg-slate-950 border-b border-white/5 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/20" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
              <div className="w-3 h-3 rounded-full bg-green-500/20" />
            </div>
            
            {/* Mockup Content */}
            <div className="p-6 relative">
              <div className="w-full h-32 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 mb-4 animate-pulse" />
              <div className="space-y-3">
                <div className="h-4 w-3/4 bg-white/10 rounded" />
                <div className="h-3 w-full bg-white/5 rounded" />
                <div className="h-3 w-5/6 bg-white/5 rounded" />
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-6">
                <div className="h-24 rounded-lg bg-white/5 border border-white/5 p-3">
                    <div className="w-8 h-8 rounded bg-blue-500/20 mb-2" />
                    <div className="h-2 w-12 bg-white/10 rounded" />
                </div>
                <div className="h-24 rounded-lg bg-white/5 border border-white/5 p-3">
                    <div className="w-8 h-8 rounded bg-purple-500/20 mb-2" />
                    <div className="h-2 w-12 bg-white/10 rounded" />
                </div>
              </div>

               {/* Hover Effect Light */}
               <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            </div>

            {/* "Live" Badge */}
            <div className="absolute bottom-6 right-6 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                Live Preview
            </div>
          </motion.div>

          {/* Floating Code Snippets (Behind) */}
          <motion.div 
            style={{ y: y2, x: 50, rotate: -5 }}
            className="absolute top-20 right-0 w-[280px] p-4 rounded-xl bg-black/80 border border-white/10 backdrop-blur-md z-10 font-mono text-xs text-blue-300"
          >
             <div className="flex gap-2 mb-2 opacity-50"><Code size={12} /> config.ts</div>
             <p className="opacity-70">
              const theme = &#123;<br/>
              &nbsp;&nbsp;colors: &#123;<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;primary: '#3B82F6',<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;accent: '#8B5CF6'<br/>
              &nbsp;&nbsp;&#125;<br/>
              &#125;;
             </p>
          </motion.div>

           <motion.div 
            style={{ y: y2, x: -50, rotate: 5 }}
            className="absolute bottom-20 left-0 w-[240px] p-4 rounded-xl bg-slate-800/80 border border-white/10 backdrop-blur-md z-30 shadow-xl"
          >
             <div className="flex items-center gap-3 mb-3 border-b border-white/10 pb-2">
                 <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white"><Zap size={16} /></div>
                 <div>
                     <div className="text-sm font-bold text-white">Performance</div>
                     <div className="text-[10px] text-gray-400">Score: 100/100</div>
                 </div>
             </div>
             <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                 <div className="h-full w-full bg-green-500 rounded-full" />
             </div>
          </motion.div>

        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        style={{ opacity }}
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-gray-500 flex flex-col items-center gap-2"
      >
        <span className="text-xs uppercase tracking-widest">Scroll</span>
        <div className="w-px h-12 bg-gradient-to-b from-gray-500 to-transparent" />
      </motion.div>
    </div>
  );
};
