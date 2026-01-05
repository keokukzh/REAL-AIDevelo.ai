import React, { useMemo } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Play, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { HeroBackground } from './hero/HeroBackground';
import { HeroPhone } from './hero/HeroPhone';
import { HeroWaveAnimation } from './animations/HeroWaveAnimation';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { trackCTAClick } from '../../lib/analytics';

interface VoiceHeroProps {
  onStartOnboarding?: () => void;
  onScrollToSection?: (href: string) => void;
}

export const VoiceHero: React.FC<VoiceHeroProps> = ({ onStartOnboarding, onScrollToSection }) => {
  const { scrollY } = useScroll();
  const yContent = useTransform(scrollY, [0, 500], [0, 100]);
  const prefersReducedMotion = useReducedMotion();

  // Split headline for kinetic typography
  const headlineWords = useMemo(() => ['Ihr', '24/7', 'Teamqualifizierer'], []);

  const subheadlineWords = useMemo(() => ['für', 'Schweizer', 'KMUs'], []);

  const scrollToDemo = () => {
    const demoSection = document.getElementById('demo');
    if (demoSection) {
      const headerOffset = 80;
      const elementPosition = demoSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + globalThis.window.pageYOffset - headerOffset;
      globalThis.window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  const handlePrimary = () => {
    trackCTAClick('hero_primary', 'hero');
    if (onStartOnboarding) {
      onStartOnboarding();
    } else if (onScrollToSection) {
      onScrollToSection('#onboarding');
    } else {
      window.location.href = '/onboarding';
    }
  };

  const handleDemoClick = () => {
    trackCTAClick('hero_demo', 'hero');
    scrollToDemo();
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-12">
      {/* Background */}
      <HeroBackground />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_90%)] -z-40 pointer-events-none" />

      {/* Main Container */}
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Column: Text */}
          <motion.div
            style={{ y: yContent }}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-10 text-center lg:text-left"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm shadow-lg hover:bg-slate-800/70 transition-colors cursor-default mx-auto lg:mx-0">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold tracking-wide text-slate-300 uppercase">
                Jetzt live: Schweizerdeutsch v2.0
              </span>
            </div>

            {/* Heading with Kinetic Typography */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-display leading-tight tracking-tight drop-shadow-2xl mb-6">
              <span className="text-white inline-flex flex-wrap gap-x-2">
                {headlineWords.map((word, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: prefersReducedMotion ? 0 : 0.5,
                      delay: prefersReducedMotion ? 0 : i * 0.1,
                      ease: [0.19, 1, 0.22, 1],
                    }}
                    className="inline-block"
                  >
                    {word}
                  </motion.span>
                ))}
              </span>
              <br />
              <span className="gradient-text inline-flex flex-wrap gap-x-2 opacity-90">
                {subheadlineWords.map((word, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: prefersReducedMotion ? 0 : 0.5,
                      delay: prefersReducedMotion ? 0 : (headlineWords.length + i) * 0.1,
                      ease: [0.19, 1, 0.22, 1],
                    }}
                    className="inline-block"
                  >
                    {word}
                  </motion.span>
                ))}
              </span>
            </h1>

            {/* Floating Voice Wave Visualization */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: prefersReducedMotion ? 0 : 0.6, duration: 0.5 }}
              className="mt-8 mb-8"
            >
              <HeroWaveAnimation />
            </motion.div>

            {/* Subheading */}
            <div className="text-lg md:text-xl text-slate-200 max-w-xl leading-relaxed font-light mx-auto lg:mx-0 mb-8">
              <p>
                Verpassen Sie nie wieder einen Kunden. Automatische Terminbuchung,
                Lead-Qualifizierung und Kundenbetreuung in Schweizerdeutsch. Geht in 24h live – ohne
                IT-Aufwand.
              </p>
            </div>

            {/* Benefits List */}
            <div className="space-y-4 max-w-md mx-auto lg:mx-0 mb-8">
              <div className="flex items-start gap-4 text-slate-200 text-sm p-3 rounded-lg bg-slate-900/30 border border-slate-800/50 hover:border-emerald-500/30 transition-colors">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  Versteht Schweizerdeutsch & Hochdeutsch – natürlich und empathisch
                </span>
              </div>
              <div className="flex items-start gap-4 text-slate-200 text-sm p-3 rounded-lg bg-slate-900/30 border border-slate-800/50 hover:border-emerald-500/30 transition-colors">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  Bucht Termine direkt in Google/Outlook Kalender – keine Doppelbuchungen
                </span>
              </div>
              <div className="flex items-start gap-4 text-slate-200 text-sm p-3 rounded-lg bg-slate-900/30 border border-slate-800/50 hover:border-emerald-500/30 transition-colors">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  Qualifiziert Leads automatisch – nur ernsthafte Kunden landen bei Ihnen
                </span>
              </div>
              <div className="flex items-start gap-4 text-slate-200 text-sm p-3 rounded-lg bg-slate-900/30 border border-slate-800/50 hover:border-emerald-500/30 transition-colors">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  24/7 erreichbar – auch nachts und am Wochenende
                </span>
              </div>
              <div className="flex items-start gap-4 text-slate-200 text-sm p-3 rounded-lg bg-slate-900/30 border border-slate-800/50 hover:border-emerald-500/30 transition-colors">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  Geht in 24h live – inkl. Kalender-Integration und Skript-Anpassung
                </span>
              </div>
              <div className="flex items-start gap-4 text-slate-200 text-sm p-3 rounded-lg bg-slate-900/30 border border-slate-800/50 hover:border-emerald-500/30 transition-colors">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">DSGVO/nDSG-konform – Hosting in der Schweiz</span>
              </div>
              <div className="flex items-start gap-4 text-slate-200 text-sm p-3 rounded-lg bg-slate-900/30 border border-slate-800/50 hover:border-emerald-500/30 transition-colors">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  Kann unterbrochen werden (Full Duplex) – wie ein echter Gesprächspartner
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-6">
              <Button
                onClick={handlePrimary}
                variant="secondary"
                className="!bg-gradient-to-r !from-blue-600 !to-cyan-500 hover:!from-blue-500 hover:!to-cyan-400 !border-none !text-white shadow-xl shadow-blue-900/50 hover:shadow-2xl hover:shadow-blue-900/60 px-8 sm:px-12 py-6 sm:py-7 text-base sm:text-lg font-bold transform hover:scale-105 transition-all duration-200 min-h-[44px] min-w-[44px]"
                icon={<Play size={20} className="fill-current sm:w-6 sm:h-6" />}
                aria-label="Jetzt kostenlos testen"
              >
                Jetzt kostenlos testen
              </Button>
              <Button
                onClick={handleDemoClick}
                variant="secondary"
                className="border-2 border-slate-600 hover:border-cyan-400 hover:bg-slate-800/80 px-6 sm:px-8 py-6 sm:py-7 text-sm sm:text-base font-semibold transition-all duration-200 min-h-[44px] min-w-[44px]"
                aria-label="Zur Demo-Sektion scrollen"
              >
                Demo anhören
              </Button>
            </div>
            <p className="text-sm text-slate-400 mt-4">
              24/7 erreichbar, Termin-Ready in 24h. Keine verpassten Anrufe mehr.
            </p>
          </motion.div>

          {/* Right Column: Hero Phone Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.8,
              delay: prefersReducedMotion ? 0 : 0.2,
            }}
            className="relative lg:h-[700px] flex items-center justify-center perspective-1000"
          >
            {/* Breathing Glow Effect behind Phone */}
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 rounded-full blur-[80px] -z-10"
              animate={
                prefersReducedMotion
                  ? {}
                  : {
                      scale: [1, 1.1, 1],
                      opacity: [0.3, 0.4, 0.3],
                    }
              }
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Phone with subtle float animation */}
            <motion.div
              animate={
                prefersReducedMotion
                  ? {}
                  : {
                      y: [0, -10, 0],
                    }
              }
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <HeroPhone />
            </motion.div>

            {/* Floating Elements (Decorations) */}
            {!prefersReducedMotion && (
              <>
                <motion.div
                  animate={{ y: [0, -20, 0] }}
                  transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
                  className="absolute top-20 right-10 bg-slate-800/80 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-xl hidden lg:block"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-mono text-slate-300">Termin gebucht: 14:30</span>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 20, 0] }}
                  transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut', delay: 1 }}
                  className="absolute bottom-40 -left-10 bg-slate-800/80 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-xl hidden lg:block"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                    <span className="text-xs font-mono text-slate-300">Anruf transkribiert</span>
                  </div>
                </motion.div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
