import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, CheckCircle2, Brain, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';

interface PersonalizedAIHeroProps {
  t: {
    heroText1: string;
    heroText2: string;
    heroSub: string;
    missionStart: string;
    scrollExplore: string;
  };
}

export const PersonalizedAIHero: React.FC<PersonalizedAIHeroProps> = ({ t }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 100]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-[95vh] flex items-center justify-center pt-24 pb-12 overflow-visible"
      aria-label="Personalized AI Services Intro"
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex flex-wrap items-center gap-3 mb-8">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/40 backdrop-blur-md border border-white/10 text-xs font-mono text-white/80 ultra-glass">
                <Brain size={14} className="text-emerald-500" />
                KI-EXPERTISE AKTIV
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-swiss-red/10 backdrop-blur-md border border-swiss-red/20 text-xs font-mono text-swiss-red ultra-glass">
                <img
                  src="https://flagcdn.com/w20/ch.png"
                  alt="Switzerland"
                  className="w-4 h-auto rounded-sm"
                />
                MADE IN SWITZERLAND
              </div>
            </div>
          </motion.div>

          {/* Headline */}
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold font-display text-white leading-[0.9] tracking-tight mb-8">
            {t.heroText1} <br />
            <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 group/title py-2">
              {t.heroText2}
              <motion.span
                className="absolute -bottom-1 left-0 w-full h-2 bg-swiss-red shadow-[0_5px_15px_-3px_rgba(218,41,28,0.5)]"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.8, duration: 1, ease: 'circOut' }}
                style={{ originX: 0 }}
              />
            </span>
          </h1>

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
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4 text-sm text-gray-400 font-mono">
            <div className="flex items-center gap-2 group/trust">
              <CheckCircle2
                size={16}
                className="text-emerald-500 group-hover:scale-125 transition-transform"
              />
              <span className="text-gray-300 group-hover:text-white transition-colors">
                Maßgeschneiderte Lösungen
              </span>
            </div>
            <div className="flex items-center gap-2 group/trust">
              <CheckCircle2
                size={16}
                className="text-blue-500 group-hover:scale-125 transition-transform"
              />
              <span className="text-gray-300 group-hover:text-white transition-colors">
                End-to-End Implementierung
              </span>
            </div>
            <div className="flex items-center gap-2 group/trust">
              <CheckCircle2
                size={16}
                className="text-purple-500 group-hover:scale-125 transition-transform"
              />
              <span className="text-gray-300 group-hover:text-white transition-colors">
                Kontinuierlicher Support
              </span>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Visual Element */}
        <motion.div
          style={{ y: y1 }}
          className="relative w-full z-10"
          initial={{ opacity: 0, scale: 0.9, rotateX: 10 }}
          animate={{ opacity: 1, scale: 1, rotateX: 0 }}
          transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative w-full aspect-square max-w-lg mx-auto">
            {/* Animated Background Circle */}
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-swiss-red/20 via-purple-500/20 to-blue-500/20 blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: 'linear',
              }}
            />

            {/* Central Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="relative"
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 30,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              >
                <Brain size={120} className="text-swiss-red drop-shadow-2xl" />
              </motion.div>
            </div>

            {/* Floating Particles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  top: `${20 + i * 15}%`,
                  left: `${15 + (i % 3) * 30}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.3, 0.8, 0.3],
                }}
                transition={{
                  duration: 3 + i * 0.5,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
              >
                <Sparkles size={24} className="text-purple-400" />
              </motion.div>
            ))}
          </div>

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
          animate={{ height: ['0%', '100%', '0%'], opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </section>
  );
};
