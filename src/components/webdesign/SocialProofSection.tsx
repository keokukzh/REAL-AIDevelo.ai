import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Award, Shield, Zap } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface SocialProofSectionProps {
  lang?: 'de' | 'en';
}

const SOCIAL_PROOF_DICTIONARY = {
  de: {
    eyebrow: 'Warum AIDevelo',
    title: 'Vertrauen durch',
    titleHighlight: 'Exzellenz',
    sub: 'Messbare Ergebnisse, bewährte Technologien, höchste Standards.',
    items: [
      {
        icon: Award,
        value: '99/100',
        label: 'Lighthouse Score',
        description: 'Top Performance garantiert',
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/20',
      },
      {
        icon: Zap,
        value: '< 2.5s',
        label: 'Ladezeit',
        description: 'Blitzschnelle Websites',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20',
      },
      {
        icon: Shield,
        value: '100%',
        label: 'DSGVO-konform',
        description: 'Maximale Sicherheit',
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/20',
      },
      {
        icon: CheckCircle2,
        value: 'Made in',
        label: 'Switzerland',
        description: 'Swiss Quality Standards',
        color: 'text-swiss-red',
        bgColor: 'bg-swiss-red/10',
        borderColor: 'border-swiss-red/20',
      },
    ],
  },
  en: {
    eyebrow: 'Why AIDevelo',
    title: 'Trust through',
    titleHighlight: 'Excellence',
    sub: 'Measurable results, proven technologies, highest standards.',
    items: [
      {
        icon: Award,
        value: '99/100',
        label: 'Lighthouse Score',
        description: 'Top performance guaranteed',
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/20',
      },
      {
        icon: Zap,
        value: '< 2.5s',
        label: 'Load Time',
        description: 'Lightning-fast websites',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20',
      },
      {
        icon: Shield,
        value: '100%',
        label: 'GDPR Compliant',
        description: 'Maximum security',
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/20',
      },
      {
        icon: CheckCircle2,
        value: 'Made in',
        label: 'Switzerland',
        description: 'Swiss Quality Standards',
        color: 'text-swiss-red',
        bgColor: 'bg-swiss-red/10',
        borderColor: 'border-swiss-red/20',
      },
    ],
  },
};

export const SocialProofSection: React.FC<SocialProofSectionProps> = ({ lang = 'de' }) => {
  const t = SOCIAL_PROOF_DICTIONARY[lang];
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      id="social-proof"
      className="py-8 sm:py-12 relative overflow-hidden scroll-mt-20"
      role="region"
      aria-labelledby="social-proof-heading"
    >
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/20 to-transparent pointer-events-none" />

      <div className="container mx-auto px-6 relative z-20 max-w-7xl">
        <ScrollReveal direction="up" className="text-center mb-12">
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={prefersReducedMotion ? {} : { duration: 0.4 }}
            className="inline-block px-4 py-1.5 rounded-full bg-swiss-red/10 border border-swiss-red/20 text-swiss-red text-xs font-bold uppercase tracking-widest mb-4"
          >
            {t.eyebrow}
          </motion.div>
          <h2
            id="social-proof-heading"
            className="text-3xl md:text-4xl font-bold font-display mb-4 tracking-tight"
          >
            {t.title} <span className="text-swiss-red">{t.titleHighlight}</span>
          </h2>
          <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto font-light">
            {t.sub}
          </p>
        </ScrollReveal>

        {/* Grid of Trust Signals */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
          {t.items.map((item, index) => (
            <ScrollReveal
              key={item.label}
              direction="up"
              delay={index * 0.1}
              className="h-full"
            >
              <motion.div
                whileHover={prefersReducedMotion ? {} : { y: -4, scale: 1.02 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="h-full p-4 md:p-6 rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-white/5 hover:border-white/20 transition-all group relative overflow-hidden"
              >
                {/* Hover glow effect */}
                <div
                  className={`absolute inset-0 ${item.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl blur-xl`}
                  aria-hidden="true"
                />

                <div className="relative z-10 text-center">
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-xl ${item.bgColor} ${item.borderColor} border mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <item.icon className={`w-6 h-6 md:w-7 md:h-7 ${item.color}`} aria-hidden="true" />
                  </div>
                  <div className={`text-2xl md:text-3xl font-bold font-display ${item.color} mb-1`}>
                    {item.value}
                  </div>
                  <div className="text-xs md:text-sm font-semibold text-white/90 mb-1 uppercase tracking-wider">
                    {item.label}
                  </div>
                  <div className="text-[10px] md:text-xs text-gray-400 font-light">
                    {item.description}
                  </div>
                </div>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};
