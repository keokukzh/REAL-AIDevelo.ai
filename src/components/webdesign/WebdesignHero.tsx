import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { ArrowRight, CheckCircle2, Shield, Zap, Award } from 'lucide-react';
import { Button } from '../ui/Button';
import { WebdesignSlideshow } from './WebdesignSlideshow';
import { BlurText } from './BlurText';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { Magnet, ClickSpark, StarBorder } from './react-bits';

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
  const headlineRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const prefersReducedMotion = useReducedMotion();
  const isInView = useInView(headlineRef, { once: true, amount: 0.3 });
  
  // Parallax for slideshow
  const y1 = useTransform(scrollY, [0, 500], [0, 50]);
  // Parallax for badges (slight upward movement)
  const badgeY = useTransform(scrollY, [0, 300], [0, -15]);
  // Headline scale and fade on scroll
  const headlineScale = useTransform(scrollY, [0, 400], [1, 0.95]);
  const headlineOpacity = useTransform(scrollY, [0, 400], [1, 0.7]);
  // Scroll indicator opacity
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  // Background gradient movement
  const gradientX = useTransform(scrollY, [0, 1000], [0, 50]);
  const gradientY = useTransform(scrollY, [0, 1000], [0, 30]);

  const [showSpecs, setShowSpecs] = useState(false);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center pt-24 pb-12 overflow-visible"
      aria-label="Webdesign Services Introduction"
    >
      {/* Animated Background Gradient */}
      <motion.div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          x: prefersReducedMotion ? 0 : gradientX,
          y: prefersReducedMotion ? 0 : gradientY,
        }}
      >
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-swiss-red/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/20 blur-[100px] rounded-full" />
      </motion.div>
      {/* Content Container */}
      <div className="container mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left Column: Typography & CTA */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="text-left relative z-20"
        >
          {/* Enhanced Trust Badges - More Prominent */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.2 }}
            style={prefersReducedMotion ? {} : { y: badgeY }}
            className="mb-10"
          >
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <StarBorder starCount={8} speed={0.5}>
                <motion.div
                  initial={prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={prefersReducedMotion ? {} : { delay: 0.2, duration: 0.4 }}
                  whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900/60 backdrop-blur-xl border border-white/20 text-xs font-mono text-white/90 shadow-lg ultra-glass"
                >
                  <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                  SYSTEMS ONLINE & READY
                </motion.div>
              </StarBorder>
              <StarBorder starCount={8} speed={0.5}>
                <motion.div
                  initial={prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={prefersReducedMotion ? {} : { delay: 0.3, duration: 0.4 }}
                  whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-swiss-red/20 backdrop-blur-xl border border-swiss-red/30 text-xs font-mono text-swiss-red shadow-lg ultra-glass"
                >
                  <img
                    src="https://flagcdn.com/w20/ch.png"
                    alt="Switzerland"
                    className="w-5 h-auto rounded-sm"
                  />
                  MADE IN SWITZERLAND
                </motion.div>
              </StarBorder>
            </div>
            
            {/* Additional Trust Badges Row */}
            <div className="flex flex-wrap items-center gap-4">
              <motion.div
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={prefersReducedMotion ? {} : { delay: 0.4 }}
                whileHover={prefersReducedMotion ? {} : { scale: 1.05, y: -2 }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 text-xs font-medium text-gray-300 hover:text-white transition-colors"
              >
                <Shield size={14} className="text-emerald-400" />
                Performance optimiert
              </motion.div>
              <motion.div
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={prefersReducedMotion ? {} : { delay: 0.5 }}
                whileHover={prefersReducedMotion ? {} : { scale: 1.05, y: -2 }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 text-xs font-medium text-gray-300 hover:text-white transition-colors"
              >
                <Award size={14} className="text-blue-400" />
                Transparentes Festpreis-Modell
              </motion.div>
            </div>
          </motion.div>

          {/* Headline with Glassmorphism Card */}
          <motion.div
            ref={headlineRef}
            style={prefersReducedMotion ? {} : { scale: headlineScale, opacity: headlineOpacity }}
            className="mb-8 relative"
          >
            <div className="relative bg-slate-900/30 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 lg:p-10 shadow-2xl ultra-glass">
              <BlurText
                text={`${t.heroText1} ${t.heroText2}`}
                animateBy="words"
                direction="top"
                delay={150}
                stepDuration={0.4}
                className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold font-display text-white leading-[0.9] tracking-tight"
              />
              <motion.span
                className="absolute bottom-8 left-8 right-8 h-1 bg-gradient-to-r from-swiss-red via-red-500 to-swiss-red shadow-[0_5px_15px_-3px_rgba(218,41,28,0.5)]"
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
                transition={{ delay: 1.2, duration: 1, ease: 'circOut' }}
                style={{ originX: 0 }}
              />
            </div>
          </motion.div>

          <motion.p
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? {} : { delay: 0.6, duration: 0.8 }}
            className="text-xl sm:text-2xl text-gray-300 mb-10 max-w-xl leading-relaxed font-light"
          >
            {t.heroSub}
          </motion.p>

          {/* Enhanced CTAs with Micro-Interactions */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? {} : { delay: 0.8, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-5 mb-12"
          >
            <Magnet strength={0.2}>
              <ClickSpark particleCount={12} color="#DA291C">
                <motion.div
                  whileHover={prefersReducedMotion ? {} : { scale: 1.03 }}
                  whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  <Button
                    onClick={() =>
                      document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })
                    }
                    variant="primary"
                    className="group relative overflow-hidden h-16 px-12 text-lg font-bold shadow-[0_0_40px_-10px_rgba(220,38,38,0.5)] hover:shadow-[0_0_60px_-10px_rgba(220,38,38,0.7)] transition-all duration-500 bg-swiss-red hover:bg-red-600"
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_2s_infinite]" />
                    <span className="relative z-10 flex items-center gap-3 uppercase tracking-wider">
                      {t.missionStart}{' '}
                      <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                  </Button>
                </motion.div>
              </ClickSpark>
            </Magnet>

            <Magnet strength={0.15}>
              <motion.div
                whileHover={prefersReducedMotion ? {} : { scale: 1.03 }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <Button
                  onClick={() => setShowSpecs(!showSpecs)}
                  variant="outline"
                  className={`h-16 px-10 text-lg ultra-glass-light border-2 transition-all duration-300 ${
                    showSpecs 
                      ? 'bg-white/10 border-white/40 text-white shadow-lg' 
                      : 'border-white/20 hover:border-white/40 hover:bg-white/5 text-gray-300 hover:text-white hover:shadow-lg'
                  }`}
                  aria-label={showSpecs ? t.closeSpecs : t.showSpecs}
                  aria-expanded={showSpecs}
                >
                  <span className="relative flex items-center gap-2">
                    {showSpecs ? t.closeSpecs : t.showSpecs}
                    <Zap size={18} className={showSpecs ? 'rotate-180 transition-transform duration-300' : 'transition-transform duration-300'} />
                  </span>
                </Button>
              </motion.div>
            </Magnet>
          </motion.div>

          {/* Enhanced Trust Indicators - More Prominent */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? {} : { delay: 1, duration: 0.8 }}
            className="flex flex-wrap items-center gap-x-8 gap-y-4 text-base"
          >
            <motion.div
              whileHover={prefersReducedMotion ? {} : { scale: 1.05, x: 4 }}
              className="flex items-center gap-3 group/trust px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/30 transition-all"
            >
              <CheckCircle2
                size={20}
                className="text-emerald-500 group-hover:scale-125 transition-transform"
              />
              <span className="text-gray-200 group-hover:text-white font-medium transition-colors">
                99+ Lighthouse Score
              </span>
            </motion.div>
            <motion.div
              whileHover={prefersReducedMotion ? {} : { scale: 1.05, x: 4 }}
              className="flex items-center gap-3 group/trust px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/30 transition-all"
            >
              <Zap
                size={20}
                className="text-blue-500 group-hover:scale-125 transition-transform"
              />
              <span className="text-gray-200 group-hover:text-white font-medium transition-colors">
                &lt; 2.5s Ladezeit
              </span>
            </motion.div>
            <motion.div
              whileHover={prefersReducedMotion ? {} : { scale: 1.05, x: 4 }}
              className="flex items-center gap-3 group/trust px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 transition-all"
            >
              <Shield
                size={20}
                className="text-purple-500 group-hover:scale-125 transition-transform"
              />
              <span className="text-gray-200 group-hover:text-white font-medium transition-colors">
                DSGVO-konform
              </span>
            </motion.div>
          </motion.div>
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
