import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { NeonBackgroundBlobs } from './NeonBackgroundBlobs';
import { GridOverlay } from './GridOverlay';
import { AnimatedHeadline } from './AnimatedHeadline';
import { HeroDeviceFrame } from './HeroDeviceFrame';

interface WebdesignHeroFuturisticProps {
  t: {
    heroHeadline: string;
    heroSubheadline: string;
    heroBullets: string[];
    ctaPrimary: string;
    ctaSecondary: string;
    heroTrustLighthouse?: string;
    heroTrustLoadTime?: string;
    heroTrustGdpr?: string;
    scrollExplore?: string;
  };
}

/**
 * WebdesignHeroFuturistic - Futuristischer Hero-Header im Stil von Vercel Ship & Lusion
 * 
 * Features:
 * - 2-spaltiges Layout (Text links, Device-Frame rechts)
 * - Neon-Glow-Effekte (Cyan/Violett)
 * - Animierte Hintergrund-Blobs
 * - 3D-Device-Frame mit Mouse-Parallax
 * - Entry-Animationen mit Stagger
 * - Hover-Interaktionen
 * - Performance-optimiert (GPU-Transforms, Reduced Motion)
 */
export const WebdesignHeroFuturistic: React.FC<WebdesignHeroFuturisticProps> = ({ t }) => {
  const prefersReducedMotion = useReducedMotion();

  // Headline in Zeilen aufteilen basierend auf dem Plan-Format
  // Format: "Premium Webdesign, das messbare Ergebnisse liefert – für Schweizer KMU, die online wachsen wollen."
  // Sollte werden:
  // Line 1: "Premium Webdesign,"
  // Line 2: "das messbare Ergebnisse liefert" (mit Neon-Glow)
  // Line 3: "– für Schweizer KMU, die online wachsen wollen."
  const headlineLines = (() => {
    const headline = t.heroHeadline;
    // Versuche, nach "–" zu splitten
    const parts = headline.split('–');
    if (parts.length >= 2) {
      const firstPart = parts[0].trim();
      // Suche nach Komma in firstPart
      const commaIndex = firstPart.indexOf(',');
      if (commaIndex > 0) {
        const beforeComma = firstPart.substring(0, commaIndex + 1).trim();
        const afterComma = firstPart.substring(commaIndex + 1).trim();
        // Wenn nach dem Komma noch Text kommt, teile dort
        if (afterComma) {
          return [
            beforeComma, // "Premium Webdesign,"
            afterComma, // "das messbare Ergebnisse liefert"
            '– ' + parts[1].trim(), // "– für Schweizer KMU, die online wachsen wollen."
          ];
        }
      }
      // Fallback: Teile nach "das" auf, wenn kein Komma gefunden
      const dasIndex = firstPart.indexOf('das');
      if (dasIndex > 0) {
        return [
          firstPart.substring(0, dasIndex).trim() + ',',
          firstPart.substring(dasIndex).trim(),
          '– ' + parts[1].trim(),
        ];
      }
      // Wenn kein "das" gefunden, teile einfach am Komma
      if (commaIndex > 0) {
        return [
          firstPart.substring(0, commaIndex + 1).trim(),
          firstPart.substring(commaIndex + 1).trim() || firstPart,
          '– ' + parts[1].trim(),
        ];
      }
    }
    // Fallback: Einfache Aufteilung in maximal 3 Zeilen
    const words = headline.split(' ');
    if (words.length > 10) {
      const third = Math.ceil(words.length / 3);
      return [
        words.slice(0, third).join(' '),
        words.slice(third, third * 2).join(' '),
        words.slice(third * 2).join(' '),
      ];
    }
    return [headline];
  })();

  // Entry Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.6,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  const bulletVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: prefersReducedMotion ? 0 : 0.8 + i * 0.06,
        duration: prefersReducedMotion ? 0 : 0.5,
        ease: [0.22, 1, 0.36, 1],
      },
    }),
  };

  const ctaVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        delay: prefersReducedMotion ? 0 : 0.8,
        duration: prefersReducedMotion ? 0 : 0.5,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  const deviceVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 24 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        delay: prefersReducedMotion ? 0 : 0.4,
        duration: prefersReducedMotion ? 0 : 0.8,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  const handlePrimaryCTA = () => {
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
      contactForm.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSecondaryCTA = () => {
    const examples = document.getElementById('examples') || document.getElementById('showcase');
    if (examples) {
      examples.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      className="relative min-h-screen flex items-center justify-center pt-24 pb-12 overflow-hidden bg-slate-950"
      aria-label="Hero Section"
    >
      {/* Background Layers */}
      <NeonBackgroundBlobs />
      <GridOverlay />

      {/* Content Container */}
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Left Column: Text Stack */}
          <motion.div
            className="text-left relative z-20"
            variants={itemVariants}
          >
            {/* Status Badge */}
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: prefersReducedMotion ? 0 : 0.2, duration: 0.4 }}
              className="mb-8"
            >
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/60 backdrop-blur-xl border border-cyan-500/30 text-xs font-mono text-cyan-400 shadow-lg"
                whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
              >
                <motion.span
                  className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                  animate={prefersReducedMotion ? {} : {
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.7, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
                <span>UPLINK_STATUS: BEREIT</span>
              </motion.div>
            </motion.div>

            {/* Animated Headline */}
            <div className="mb-8">
              <AnimatedHeadline lines={headlineLines} />
            </div>

            {/* Subheadline */}
            <motion.p
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: prefersReducedMotion ? 0 : 0.6,
                duration: prefersReducedMotion ? 0 : 0.8,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="text-xl sm:text-2xl text-gray-300 mb-10 max-w-xl leading-relaxed font-light"
            >
              {t.heroSubheadline}
            </motion.p>

            {/* Bullet Points */}
            <motion.ul
              className="space-y-4 mb-10"
              initial="hidden"
              animate="visible"
            >
              {t.heroBullets.map((bullet, index) => (
                <motion.li
                  key={index}
                  custom={index}
                  variants={bulletVariants}
                  className="flex items-start gap-3 text-gray-300"
                >
                  <CheckCircle2
                    size={20}
                    className="text-cyan-400 mt-0.5 flex-shrink-0"
                  />
                  <span className="leading-relaxed">{bullet}</span>
                </motion.li>
              ))}
            </motion.ul>

            {/* CTAs */}
            <motion.div
              className="flex flex-col sm:flex-row gap-5 mb-12"
              variants={ctaVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Primary CTA */}
              <motion.div
                whileHover={prefersReducedMotion ? {} : { scale: 1.03 }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <Button
                  onClick={handlePrimaryCTA}
                  variant="primary"
                  className="group relative overflow-hidden h-16 px-12 text-lg font-bold shadow-[0_0_40px_-10px_rgba(6,182,212,0.5)] hover:shadow-[0_0_60px_-10px_rgba(6,182,212,0.7)] transition-all duration-500 bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_2s_infinite]" />
                  <span className="relative z-10 flex items-center gap-3 uppercase tracking-wider">
                    {t.ctaPrimary}
                    <ArrowRight
                      size={20}
                      className="group-hover:translate-x-1 transition-transform duration-300"
                    />
                  </span>
                </Button>
              </motion.div>

              {/* Secondary CTA */}
              <motion.div
                whileHover={prefersReducedMotion ? {} : { scale: 1.03 }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <Button
                  onClick={handleSecondaryCTA}
                  variant="outline"
                  className="h-16 px-10 text-lg border-2 border-white/20 hover:border-white/40 hover:bg-white/5 text-gray-300 hover:text-white transition-all duration-300 relative group"
                >
                  <span className="relative flex items-center gap-2">
                    {t.ctaSecondary}
                    <motion.span
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-violet-500"
                      initial={{ scaleX: 0 }}
                      whileHover={{ scaleX: 1 }}
                      transition={{ duration: 0.3 }}
                      style={{ originX: 0 }}
                    />
                  </span>
                </Button>
              </motion.div>
            </motion.div>

            {/* Trust Bar */}
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: prefersReducedMotion ? 0 : 1,
                duration: prefersReducedMotion ? 0 : 0.8,
              }}
              className="flex flex-wrap items-center gap-x-8 gap-y-4 text-sm"
            >
              <div className="flex items-center gap-2 text-gray-300">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span>{t.heroTrustLighthouse || '100/100 Lighthouse-Score'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <CheckCircle2 size={16} className="text-cyan-400" />
                <span>{t.heroTrustLoadTime || '< 1 Sekunde Ladezeit'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <CheckCircle2 size={16} className="text-violet-400" />
                <span>{t.heroTrustGdpr || 'DSGVO-konform & sicher gehostet'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <CheckCircle2 size={16} className="text-swiss-red" />
                <span>Made in Switzerland</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column: Device Frame */}
          <motion.div
            className="relative w-full z-10"
            variants={deviceVariants}
            initial="hidden"
            animate="visible"
          >
            <HeroDeviceFrame
              badges={['100/100 Lighthouse', '< 1 Sekunde Ladezeit']}
            />
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        {t.scrollExplore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: prefersReducedMotion ? 0 : 1.2 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            aria-hidden="true"
          >
            <span className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em]">
              {t.scrollExplore}
            </span>
            <motion.div
              className="w-px h-12 bg-gradient-to-b from-cyan-500 to-transparent"
              animate={prefersReducedMotion ? {} : {
                height: ['0%', '100%', '0%'],
                opacity: [0, 1, 0],
              }}
              transition={prefersReducedMotion ? {} : {
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </motion.div>
        )}
      </div>
    </section>
  );
};
