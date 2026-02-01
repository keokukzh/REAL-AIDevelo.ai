import React, { useRef, Suspense, lazy } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useMediaQuery } from '../../hooks/useMediaQuery';

// Lazy-load HeroShowcase for better initial load performance
const HeroShowcase = lazy(() =>
  import('./HeroShowcase').then((m) => ({
    default: m.HeroShowcase,
  })).catch((err) => {
    console.error('Failed to load HeroShowcase:', err);
    // Return a fallback component
    return { default: () => <div className="w-full aspect-[4/3] bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[1.5rem] animate-pulse" /> };
  }),
) as React.LazyExoticComponent<React.FC>;

interface WebdesignHeroRedesignedProps {
  t: {
    heroHeadline: string;
    heroSubheadline: string;
    heroBullets: string[];
    ctaPrimary: string;
    ctaSecondary: string;
  };
}

/**
 * WebdesignHeroRedesigned - Komplett neuer Hero-Bereich mit 2-spaltigem Layout
 * 
 * Features:
 * - 2-spaltiges Layout (Desktop): Text links, Showcase rechts
 * - Mobile: Stack-Layout
 * - Staggered Entrance-Animationen
 * - Parallax-Scrolling für Showcase
 */
export const WebdesignHeroRedesigned: React.FC<WebdesignHeroRedesignedProps> = ({ t }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Parallax for showcase
  const showcaseY = useTransform(scrollY, [0, 500], [0, 30]);

  const handlePrimaryCTA = () => {
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
      contactForm.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
    }
  };

  const handleSecondaryCTA = () => {
    const portfolio = document.getElementById('website-previews');
    if (portfolio) {
      portfolio.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
    }
  };

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center pt-24 pb-12 overflow-visible"
      aria-labelledby="webdesign-hero-heading"
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-swiss-red/20 blur-[120px] rounded-full opacity-50" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/20 blur-[100px] rounded-full opacity-50" />
      </div>

      {/* Content Container */}
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-7xl mx-auto">
          {/* Left Column: Text Content */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="text-left relative z-20"
          >
            {/* Headline */}
            <motion.h1
              id="webdesign-hero-heading"
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl font-bold font-display text-white mb-6 tracking-tight leading-[1.1]"
              tabIndex={-1}
            >
              {t.heroHeadline}
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="text-xl sm:text-2xl text-gray-300 mb-8 max-w-xl leading-relaxed font-light"
            >
              {t.heroSubheadline}
            </motion.p>

            {/* Bullet Points */}
            <motion.ul
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="space-y-4 mb-10"
            >
              {t.heroBullets.map((bullet, index) => (
                <motion.li
                  key={index}
                  initial={prefersReducedMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: 0.7 + index * 0.1,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="flex items-start gap-3"
                >
                  <CheckCircle2
                    size={20}
                    className="text-emerald-400 flex-shrink-0 mt-0.5"
                    aria-hidden="true"
                    role="img"
                  />
                  <span className="text-base sm:text-lg text-gray-200 leading-relaxed">
                    {bullet}
                  </span>
                </motion.li>
              ))}
            </motion.ul>

            {/* CTAs */}
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button
                onClick={handlePrimaryCTA}
                variant="primary"
                className="h-14 px-8 text-lg font-bold shadow-[0_0_40px_-10px_rgba(218,41,28,0.5)] hover:shadow-[0_0_60px_-10px_rgba(218,41,28,0.7)] transition-all duration-500 bg-swiss-red hover:bg-red-600 group relative overflow-hidden"
                aria-label={t.ctaPrimary}
              >
                <span className="relative z-10 flex items-center gap-2">
                  {t.ctaPrimary}
                  <ArrowRight
                    size={20}
                    className="group-hover:translate-x-1 transition-transform duration-300"
                    aria-hidden="true"
                  />
                </span>
              </Button>
              <Button
                onClick={handleSecondaryCTA}
                variant="outline"
                className="h-14 px-8 text-lg border-2 border-white/20 hover:border-white/40 hover:bg-white/5 text-gray-300 hover:text-white transition-all duration-300"
              >
                {t.ctaSecondary}
              </Button>
            </motion.div>
          </motion.div>

          {/* Right Column: Showcase */}
          <motion.div
            style={prefersReducedMotion ? {} : { y: showcaseY }}
            className="relative w-full z-10"
            initial={prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <Suspense fallback={<div className="w-full aspect-[4/3] bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[1.5rem] animate-pulse" />}>
              <HeroShowcase />
            </Suspense>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
