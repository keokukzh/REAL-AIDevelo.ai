import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { WebdesignSlideshow } from './WebdesignSlideshow';
import { BlurText } from './BlurText';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface WebdesignHeroProps {
  t: {
    heroText1: string;
    heroText2: string;
    heroSub: string;
    missionStart: string;
    showSpecs: string;
    closeSpecs: string;
    scrollExplore: string;
  };
}

export const WebdesignHero: React.FC<WebdesignHeroProps> = ({ t }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const prefersReducedMotion = useReducedMotion();
  // Subtle parallax for slideshow
  const y1 = useTransform(scrollY, [0, 500], [0, 50]);
  // Parallax for badges (slight upward movement)
  const badgeY = useTransform(scrollY, [0, 300], [0, -10]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  const [showSpecs, setShowSpecs] = useState(false);

  return (
    <section
      ref={containerRef}
      className="relative min-h-[95vh] flex items-center justify-center pt-24 pb-12 overflow-visible"
      aria-label="Webdesign Services Introduction"
    >
      {/* Content Container */}
      <div className="container mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left Column: Typography & CTA */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="text-left relative z-20"
        >
          {/* Status Chip */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.2 }}
            style={prefersReducedMotion ? {} : { y: badgeY }}
          >
            <div className="flex flex-wrap items-center gap-3 mb-8">
              <motion.div
                initial={prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={prefersReducedMotion ? {} : { delay: 0.2, duration: 0.4 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/40 backdrop-blur-md border border-white/10 text-xs font-mono text-white/80 ultra-glass"
              >
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                SYSTEMS ONLINE & READY
              </motion.div>
              <motion.div
                initial={prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={prefersReducedMotion ? {} : { delay: 0.3, duration: 0.4 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-swiss-red/10 backdrop-blur-md border border-swiss-red/20 text-xs font-mono text-swiss-red ultra-glass"
              >
                <img
                  src="https://flagcdn.com/w20/ch.png"
                  alt="Switzerland"
                  className="w-4 h-auto rounded-sm"
                />
                MADE IN SWITZERLAND
              </motion.div>
            </div>
          </motion.div>

          {/* Headline */}
          <div className="mb-8 relative">
            <BlurText
              text={`${t.heroText1} ${t.heroText2}`}
              animateBy="words"
              direction="top"
              delay={150}
              stepDuration={0.4}
              className="text-6xl sm:text-7xl lg:text-8xl font-bold font-display text-white leading-[0.9] tracking-tight"
            />
            <motion.span
              className="absolute -bottom-1 left-0 w-full h-2 bg-swiss-red shadow-[0_5px_15px_-3px_rgba(218,41,28,0.5)]"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1.2, duration: 1, ease: 'circOut' }}
              style={{ originX: 0 }}
            />
          </div>

          <p className="text-xl sm:text-2xl text-gray-400 mb-10 max-w-xl leading-relaxed font-light">
            {t.heroSub}
          </p>

          <div className="flex flex-col sm:flex-row gap-5">
            <Button
              onClick={() =>
                document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })
              }
              variant="primary"
              className="group relative overflow-hidden h-14 px-10 text-lg shadow-[0_0_40px_-10px_rgba(220,38,38,0.5)] hover:shadow-[0_0_60px_-10px_rgba(220,38,38,0.7)] transition-all duration-500"
            >
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_2s_infinite]" />
              <span className="relative z-10 flex items-center gap-3 font-bold uppercase tracking-wider">
                {t.missionStart}{' '}
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>

            <Button
              onClick={() => setShowSpecs(!showSpecs)}
              variant="outline"
              className={`h-14 px-8 text-lg ultra-glass-light border border-white/10 transition-all duration-300 ${showSpecs ? 'bg-white/10 border-white/30 text-white' : 'hover:bg-white/5 text-gray-300'}`}
              aria-label={showSpecs ? t.closeSpecs : t.showSpecs}
              aria-expanded={showSpecs}
            >
              {showSpecs ? t.closeSpecs : t.showSpecs}
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4 text-sm text-gray-400 font-mono">
            <div className="flex items-center gap-2 group/trust">
              <CheckCircle2
                size={16}
                className="text-emerald-500 group-hover:scale-125 transition-transform"
              />
              <span className="text-gray-300 group-hover:text-white transition-colors">
                99+ Mobile Store
              </span>
            </div>
            <div className="flex items-center gap-2 group/trust">
              <CheckCircle2
                size={16}
                className="text-blue-500 group-hover:scale-125 transition-transform"
              />
              <span className="text-gray-300 group-hover:text-white transition-colors">
                AAA Performance
              </span>
            </div>
            <div className="flex items-center gap-2 group/trust">
              <CheckCircle2
                size={16}
                className="text-purple-500 group-hover:scale-125 transition-transform"
              />
              <span className="text-gray-300 group-hover:text-white transition-colors">
                Clean Code Base
              </span>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Premium Slideshow Showcase */}
        <motion.div
          style={prefersReducedMotion ? {} : { y: y1 }}
          className="relative w-full z-10"
          initial={prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <WebdesignSlideshow />
          </motion.div>

          {/* Decorative Floating Elements */}
          <motion.div
            className="absolute -top-10 -right-10 w-32 h-32 bg-swiss-red/20 blur-[60px] rounded-full z-0"
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-10 -left-10 w-40 h-40 bg-accent/20 blur-[80px] rounded-full z-0"
            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 10, repeat: Infinity, delay: 1 }}
          />
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        style={{ opacity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        aria-hidden="true"
      >
        <span className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em]">
          {t.scrollExplore}
        </span>
        <motion.div
          className="w-px h-12 bg-gradient-to-b from-swiss-red to-transparent"
          animate={prefersReducedMotion ? {} : { height: ['0%', '100%', '0%'], opacity: [0, 1, 0] }}
          transition={prefersReducedMotion ? {} : { duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </section>
  );
};
