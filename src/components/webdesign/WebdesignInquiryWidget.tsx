import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { MessageSquare, Zap } from 'lucide-react';
import { trackCTAClick } from '../../lib/analytics';

export const WebdesignInquiryWidget: React.FC = () => {
  const { scrollYProgress } = useScroll();
  
  // Only show after scrolling a bit
  const opacity = useTransform(scrollYProgress, [0, 0.1], [0, 1]);
  const scale = useTransform(scrollYProgress, [0, 0.1], [0.8, 1]);

  const handleScrollToForm = () => {
    trackCTAClick('sticky_widget', 'webdesign_page');
    const formSection = document.getElementById('contact-form');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Use a timeout to ensure scroll is complete before focusing
      setTimeout(() => {
        const input = formSection.querySelector('input');
        if (input) input.focus();
      }, 800);
    }
  };

  return (
    <motion.div
      style={{ opacity, scale }}
      className="fixed bottom-8 right-8 z-[90] pointer-events-none"
    >
      <div className="relative pointer-events-auto">
        {/* Animated Rings */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 rounded-full bg-swiss-red/20 blur-xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
          className="absolute inset-[-10px] rounded-full bg-blue-500/10 blur-2xl"
        />

        {/* The Widget Button */}
        <motion.button
          onClick={handleScrollToForm}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative group bg-slate-950/80 backdrop-blur-xl border border-white/10 p-1.5 rounded-full shadow-[0_0_50px_rgba(0,0,0,0.5)] flex items-center gap-3 overflow-hidden"
        >
          {/* Glimmer Effect */}
          <motion.div
            animate={{
              left: ['-150%', '150%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12"
          />

          {/* Logo/Icon Container */}
          <div className="relative w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center">
            <img 
              src="/assets/AID-thumbnail-white.png" 
              alt="AIDevelo Logo" 
              className="w-full h-full object-cover p-2"
            />
            <motion.div 
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-swiss-red/20"
            />
          </div>

          {/* Text Content */}
          <div className="pr-6 text-left">
            <div className="text-[10px] font-mono text-swiss-red uppercase tracking-widest leading-none mb-1 flex items-center gap-1">
              <span className="w-1 h-1 bg-swiss-red rounded-full animate-pulse" />
              Live Project
            </div>
            <div className="text-sm font-bold font-display text-white tracking-tight">
              Anfrage starten
            </div>
          </div>

          {/* Action Icon */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-4 transition-all duration-300">
            <Zap size={14} className="text-swiss-red fill-current" />
          </div>
        </motion.button>

        {/* Tooltip Content (Optional but adds premium feel) */}
        <div className="absolute top-0 right-full mr-4 flex items-center h-full pointer-events-none opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500 whitespace-nowrap">
           <div className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-white/10 backdrop-blur-md text-[10px] font-mono text-gray-400">
              UPLINK_STATUS: READY
           </div>
        </div>
      </div>
    </motion.div>
  );
};
