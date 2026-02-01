import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { ArrowRight, CheckCircle2, Shield, Zap, Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '../ui/Button';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { HeroTrustBar } from './HeroTrustBar';

interface WebdesignHeroOptimizedProps {
  t: {
    heroHeadline: string;
    heroSubheadline: string;
    heroComparisonHint?: string;
    ctaPrimary: string;
    ctaSecondary: string;
    phoneNumber?: string;
    emailAddress?: string;
    scrollExplore?: string;
  };
  lang?: 'de' | 'en';
}

/**
 * WebdesignHeroOptimized - Benefit-first hero section
 * 
 * Features:
 * - Benefit-first headline hierarchy
 * - Price badge prominently displayed
 * - Trust bar integrated above fold
 * - Alternative contact methods
 * - Clear CTAs with proper accessibility
 * - Responsive design with mobile optimization
 */
export const WebdesignHeroOptimized: React.FC<WebdesignHeroOptimizedProps> = ({ 
  t, 
  lang = 'de' 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isInView = useInView(headlineRef, { once: true, amount: 0.3 });
  
  // Parallax effects
  const headlineY = useTransform(scrollY, [0, 300], [0, -20]);
  const headlineOpacity = useTransform(scrollY, [0, 300], [1, 0.7]);
  
  const handlePrimaryCTA = () => {
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
      contactForm.scrollIntoView({ 
        behavior: prefersReducedMotion ? 'auto' : 'smooth' 
      });
    }
  };

  const handleSecondaryCTA = () => {
    const examples = document.getElementById('examples') || 
                     document.getElementById('showcase') ||
                     document.getElementById('website-previews');
    if (examples) {
      examples.scrollIntoView({ 
        behavior: prefersReducedMotion ? 'auto' : 'smooth' 
      });
    }
  };

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex flex-col justify-center pt-24 pb-12 overflow-visible"
      aria-labelledby="webdesign-hero-heading"
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-swiss-red/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/20 blur-[100px] rounded-full" />
      </div>

      {/* Content Container */}
      <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-7xl">
        {/* Trust Bar - Above Fold */}
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 sm:mb-12"
        >
          <HeroTrustBar />
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column: Typography & CTAs */}
          <motion.div
            ref={headlineRef}
            style={prefersReducedMotion ? {} : { y: headlineY, opacity: headlineOpacity }}
            className="text-left relative z-20"
          >
            {/* Price Badge - Prominent Above Headline */}
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={prefersReducedMotion ? {} : { delay: 0.1, duration: 0.5 }}
              className="mb-6"
            >
              <div className="inline-flex flex-col items-start gap-2 px-6 py-4 bg-gradient-to-br from-swiss-red/20 to-red-600/20 backdrop-blur-xl border-2 border-swiss-red/40 rounded-2xl shadow-[0_0_30px_rgba(218,41,28,0.3)]">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-bold text-white">CHF 599</span>
                  <span className="text-sm text-gray-300 font-medium">
                    {lang === 'de' ? 'Festpreis' : 'Fixed Price'}
                  </span>
                </div>
                {t.heroComparisonHint && (
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">{t.heroComparisonHint}</p>
                )}
              </div>
            </motion.div>

            {/* Headline - Benefit-First */}
            <motion.h1
              id="webdesign-hero-heading"
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? {} : { delay: 0.2, duration: 0.8 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-display text-white leading-[1.1] tracking-tight mb-6"
            >
              {t.heroHeadline}
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? {} : { delay: 0.4, duration: 0.8 }}
              className="text-xl sm:text-2xl text-gray-300 mb-8 max-w-2xl leading-relaxed font-light"
            >
              {t.heroSubheadline}
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? {} : { delay: 0.6, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 mb-8"
            >
              <Button
                onClick={handlePrimaryCTA}
                variant="primary"
                className="group relative overflow-hidden h-14 sm:h-16 px-8 sm:px-12 text-base sm:text-lg font-bold shadow-[0_0_40px_-10px_rgba(220,38,38,0.5)] hover:shadow-[0_0_60px_-10px_rgba(220,38,38,0.7)] transition-all duration-500 bg-swiss-red hover:bg-red-600 focus-visible:ring-2 focus-visible:ring-swiss-red focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 cursor-pointer"
                aria-label={t.ctaPrimary}
              >
                <span className="relative z-10 flex items-center gap-3">
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
                className="h-14 sm:h-16 px-8 sm:px-10 text-base sm:text-lg border-2 border-white/20 hover:border-white/40 hover:bg-white/5 text-gray-300 hover:text-white transition-all focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 cursor-pointer"
                aria-label={t.ctaSecondary}
              >
                {t.ctaSecondary}
              </Button>
            </motion.div>

            {/* Alternative Contact Methods */}
            {(t.phoneNumber || t.emailAddress) && (
              <motion.div
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={prefersReducedMotion ? {} : { delay: 0.8, duration: 0.8 }}
                className="flex flex-wrap items-center gap-4 text-sm sm:text-base"
              >
                <span className="text-gray-400">
                  {lang === 'de' ? 'Oder kontaktieren Sie uns direkt:' : 'Or contact us directly:'}
                </span>
                {t.phoneNumber && (
                  <a
                    href={`tel:${t.phoneNumber.replace(/\s/g, '')}`}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900/40 border border-white/10 hover:border-white/20 transition-colors text-gray-300 hover:text-white focus-visible:ring-2 focus-visible:ring-swiss-red focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 cursor-pointer"
                    aria-label={lang === 'de' ? 'Rufen Sie uns an' : 'Call us'}
                  >
                    <Phone size={18} aria-hidden="true" />
                    <span>{t.phoneNumber}</span>
                  </a>
                )}
                {t.emailAddress && (
                  <a
                    href={`mailto:${t.emailAddress}`}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900/40 border border-white/10 hover:border-white/20 transition-colors text-gray-300 hover:text-white focus-visible:ring-2 focus-visible:ring-swiss-red focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 cursor-pointer"
                    aria-label={lang === 'de' ? 'Senden Sie uns eine E-Mail' : 'Send us an email'}
                  >
                    <Mail size={18} aria-hidden="true" />
                    <span>{t.emailAddress}</span>
                  </a>
                )}
              </motion.div>
            )}

            {/* Trust Indicators */}
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? {} : { delay: 1, duration: 0.8 }}
              className="flex flex-wrap items-center gap-x-6 gap-y-4 mt-8 text-sm sm:text-base"
            >
              <div className="flex items-center gap-2 text-gray-300">
                <CheckCircle2 size={18} className="text-emerald-400" aria-hidden="true" />
                <span>
                  {lang === 'de' ? '100/100 Lighthouse Score' : '100/100 Lighthouse Score'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Zap size={18} className="text-blue-400" aria-hidden="true" />
                <span>
                  {lang === 'de' ? '2-3 Wochen bis Launch' : '2-3 Weeks to Launch'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Shield size={18} className="text-purple-400" aria-hidden="true" />
                <span>
                  {lang === 'de' ? 'Made in Switzerland' : 'Made in Switzerland'}
                </span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column: Visual Element (Placeholder for slideshow or image) */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={prefersReducedMotion ? {} : { duration: 0.8, delay: 0.4 }}
            className="relative w-full z-10"
          >
            {/* Placeholder for visual content - can be replaced with WebdesignSlideshow */}
            <div className="relative aspect-[4/3] rounded-2xl bg-gradient-to-br from-slate-900/60 to-slate-950/40 backdrop-blur-xl border border-white/10 overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-swiss-red/20 border-2 border-swiss-red/40 flex items-center justify-center">
                    <MapPin className="w-12 h-12 text-swiss-red" aria-hidden="true" />
                  </div>
                  <p className="text-gray-400 text-sm">
                    {lang === 'de' 
                      ? 'Website-Vorschau oder Portfolio-Beispiele' 
                      : 'Website preview or portfolio examples'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      {t.scrollExplore && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
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
      )}
    </section>
  );
};
