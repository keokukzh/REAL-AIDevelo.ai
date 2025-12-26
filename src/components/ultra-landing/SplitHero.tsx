import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { Check, ArrowRight, Mic, Phone, Calendar, BarChart3 } from 'lucide-react';
import { DeviceMockup } from './DeviceMockup';
import { WaveformDemo } from './WaveformDemo';

const webdesignBullets = [
  'Conversion-first UI/UX',
  'SEO + Speed als Standard',
  'Motion Systems, die Brand spürbar machen',
];

const voiceBullets = [
  '24/7 erreichbar, menschlich klingend',
  'Bucht Termine, qualifiziert Leads',
  'Actions im CRM/Kalender – mit Kontrolle',
];

interface SplitHeroProps {
  onWebdesignClick?: () => void;
  onVoiceClick?: () => void;
}

export const SplitHero: React.FC<SplitHeroProps> = ({ onWebdesignClick, onVoiceClick }) => {
  const prefersReducedMotion = useReducedMotion();

  const scrollToContact = (interest: 'webdesign' | 'voice') => {
    const contactSection = document.querySelector('#contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      // Set interest in form if available
      const interestInput = document.querySelector(
        `input[value="${interest}"]`,
      ) as HTMLInputElement;
      if (interestInput) interestInput.click();
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, filter: 'blur(10px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const reducedItemVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
  };

  const variants = prefersReducedMotion ? reducedItemVariants : itemVariants;

  return (
    <section className="relative min-h-screen pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Main Headline */}
        <motion.div
          className="text-center mb-12 md:mb-20"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-display font-bold text-white leading-tight mb-6"
            variants={variants}
          >
            <span className="block">Webdesign, das verkauft.</span>
            <span className="block ultra-gradient-text">Voice Agents, die konvertieren.</span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed"
            variants={variants}
          >
            Premium Automations & digitale Experiences – gebaut von{' '}
            <span className="text-white font-medium">AIDevelo.ai</span>{' '}
            <span className="text-gray-500">(Aid Destani)</span>
          </motion.p>
        </motion.div>

        {/* Split Stage */}
        <div className="relative grid md:grid-cols-2 gap-6 md:gap-0 max-w-6xl mx-auto">
          {/* Center Divider - Desktop only */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 -translate-x-1/2 z-10">
            <div className="ultra-divider h-full relative">
              {/* Pulsing orb */}
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gradient-to-br from-violet to-cyan shadow-glow-ultra"
                animate={
                  !prefersReducedMotion
                    ? {
                        scale: [1, 1.3, 1],
                        opacity: [0.8, 1, 0.8],
                      }
                    : undefined
                }
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </div>
          </div>

          {/* LEFT: Webdesign */}
          <motion.div
            className="relative p-6 md:p-10 lg:p-12 ultra-card rounded-2xl md:rounded-r-none md:border-r-0"
            initial={!prefersReducedMotion ? { opacity: 0, x: -60 } : { opacity: 0 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
          >
            {/* Label */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-violet animate-pulse" />
              <span className="text-xs font-bold tracking-widest uppercase text-violet">
                Webdesign & UX Engineering
              </span>
            </div>

            {/* Device Mockup */}
            <div className="mb-8 flex justify-center">
              <DeviceMockup />
            </div>

            {/* Bullets */}
            <ul className="space-y-3 mb-8">
              {webdesignBullets.map((bullet, i) => (
                <motion.li
                  key={i}
                  className="flex items-start gap-3 text-gray-300"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                >
                  <Check className="w-5 h-5 text-violet shrink-0 mt-0.5" />
                  <span>{bullet}</span>
                </motion.li>
              ))}
            </ul>

            {/* CTA */}
            <button
              onClick={() => {
                onWebdesignClick?.();
                scrollToContact('webdesign');
              }}
              className="group w-full py-4 px-6 bg-violet hover:bg-violet/90 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-glow-violet ultra-btn-sheen ultra-focus"
            >
              Webdesign Audit sichern
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>

          {/* RIGHT: Voice Agents */}
          <motion.div
            className="relative p-6 md:p-10 lg:p-12 ultra-card rounded-2xl md:rounded-l-none md:border-l-0"
            initial={!prefersReducedMotion ? { opacity: 0, x: 60 } : { opacity: 0 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
          >
            {/* Label */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-cyan animate-pulse" />
              <span className="text-xs font-bold tracking-widest uppercase text-cyan">
                24/7 Voice Agents & Automations
              </span>
            </div>

            {/* Voice HUD */}
            <div className="mb-8 p-6 bg-obsidian/50 rounded-xl border border-ultra-border">
              {/* Status bar */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm text-green-400 font-medium">Live Call</span>
                </div>
                <div className="flex items-center gap-3 text-gray-500 text-xs">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    Inbound
                  </span>
                  <span>02:34</span>
                </div>
              </div>

              {/* Waveform */}
              <WaveformDemo isPlaying={true} barCount={32} />

              {/* Action indicators */}
              <div className="flex items-center justify-center gap-4 mt-4">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="w-3 h-3 text-cyan" />
                  <span>Termin buchen...</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <BarChart3 className="w-3 h-3 text-violet" />
                  <span>Lead qualifiziert</span>
                </div>
              </div>
            </div>

            {/* Bullets */}
            <ul className="space-y-3 mb-8">
              {voiceBullets.map((bullet, i) => (
                <motion.li
                  key={i}
                  className="flex items-start gap-3 text-gray-300"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + i * 0.1 }}
                >
                  <Check className="w-5 h-5 text-cyan shrink-0 mt-0.5" />
                  <span>{bullet}</span>
                </motion.li>
              ))}
            </ul>

            {/* CTA */}
            <button
              onClick={() => {
                onVoiceClick?.();
                scrollToContact('voice');
              }}
              className="group w-full py-4 px-6 bg-cyan hover:bg-cyan/90 text-obsidian font-semibold rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-glow-cyan ultra-btn-sheen ultra-focus"
            >
              <Mic className="w-4 h-4" />
              Voice Agent Demo
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
