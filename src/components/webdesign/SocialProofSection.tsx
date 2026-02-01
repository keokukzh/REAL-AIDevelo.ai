import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Award, Shield, Zap, Smartphone, Users } from 'lucide-react';
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
    sub: 'Messbare Geschäftsergebnisse, bewährte Technologien, höchste Schweizer Qualitätsstandards. Jede Website ein strategischer Wettbewerbsvorteil.',
    items: [
      {
        icon: Award,
        value: '99/100',
        label: 'Lighthouse Score',
        description: 'Top Performance – besser als 95% der Konkurrenz',
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/20',
      },
      {
        icon: Zap,
        value: '< 2.5s',
        label: 'Ladezeit',
        description: 'Steigert Conversion um bis zu 20%',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20',
      },
      {
        icon: Shield,
        value: '100%',
        label: 'DSGVO-konform',
        description: 'Schützt Kundenvertrauen & Daten',
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/20',
      },
      {
        icon: CheckCircle2,
        value: 'Made in',
        label: 'Switzerland',
        description: 'Präzision & Zuverlässigkeit',
        color: 'text-swiss-red',
        bgColor: 'bg-swiss-red/10',
        borderColor: 'border-swiss-red/20',
      },
      {
        icon: Smartphone,
        value: '100%',
        label: 'Mobiloptimiert',
        description: 'Erreicht 60%+ Ihrer Zielgruppe',
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/20',
      },
      {
        icon: Users,
        value: '1:1',
        label: 'Persönliche Betreuung',
        description: 'Strategischer Partner für Ihr Wachstum',
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10',
        borderColor: 'border-cyan-500/20',
      },
    ],
  },
  en: {
    eyebrow: 'Why AIDevelo',
    title: 'Trust through',
    titleHighlight: 'Excellence',
    sub: 'Measurable business results, proven technologies, highest Swiss quality standards. Every website a strategic competitive advantage.',
    items: [
      {
        icon: Award,
        value: '99/100',
        label: 'Lighthouse Score',
        description: 'Top performance – better than 95% of competitors',
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/20',
      },
      {
        icon: Zap,
        value: '< 2.5s',
        label: 'Load Time',
        description: 'Increases conversion by up to 20%',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20',
      },
      {
        icon: Shield,
        value: '100%',
        label: 'GDPR Compliant',
        description: 'Protects customer trust & data',
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
      {
        icon: Smartphone,
        value: '100%',
        label: 'Mobile Optimized',
        description: 'Reaches 60%+ of your target audience',
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/20',
      },
      {
        icon: Users,
        value: '1:1',
        label: 'Personal Support',
        description: 'Strategic partner for your growth',
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10',
        borderColor: 'border-cyan-500/20',
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

        {/* Bento Grid Layout - 6 Kacheln mit unterschiedlichen Größen */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 max-w-7xl mx-auto">
          {/* Large Item - Performance (spans 2 columns) */}
          <ScrollReveal
            direction="up"
            delay={0.1}
            className="md:col-span-2 lg:col-span-2"
          >
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              whileHover={prefersReducedMotion ? {} : { y: -6, scale: 1.02 }}
              className="h-full p-6 md:p-8 rounded-3xl bg-gradient-to-br from-slate-900/60 to-slate-950/40 backdrop-blur-xl border border-white/5 hover:border-white/20 transition-all group relative overflow-hidden cursor-pointer"
            >
              <div className={`absolute inset-0 ${t.items[0].bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl blur-xl`} aria-hidden="true" />
              <div className="relative z-10 h-full flex flex-col">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${t.items[0].bgColor} ${t.items[0].borderColor} border mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {React.createElement(t.items[0].icon, { className: `w-8 h-8 ${t.items[0].color}`, 'aria-hidden': true } as React.ComponentProps<'svg'>)}
                </div>
                <div className={`text-4xl md:text-5xl font-bold font-display ${t.items[0].color} mb-2`}>
                  {t.items[0].value}
                </div>
                <div className="text-sm md:text-base font-semibold text-white/90 mb-2 uppercase tracking-wider">
                  {t.items[0].label}
                </div>
                <div className="text-sm text-gray-400 font-light mt-auto">
                  {t.items[0].description}
                </div>
              </div>
            </motion.div>
          </ScrollReveal>

          {/* Medium Item - Load Time (spans 1 column) */}
          <ScrollReveal
            direction="up"
            delay={0.2}
            className="md:col-span-1 lg:col-span-2"
          >
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              whileHover={prefersReducedMotion ? {} : { y: -4, scale: 1.02 }}
              className="h-full p-6 rounded-3xl bg-slate-900/40 backdrop-blur-xl border border-white/5 hover:border-white/20 transition-all group relative overflow-hidden cursor-pointer"
            >
              <div className={`absolute inset-0 ${t.items[1].bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl blur-xl`} aria-hidden="true" />
              <div className="relative z-10 text-center">
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${t.items[1].bgColor} ${t.items[1].borderColor} border mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {React.createElement(t.items[1].icon, { className: `w-7 h-7 ${t.items[1].color}`, 'aria-hidden': true } as React.ComponentProps<'svg'>)}
                </div>
                <div className={`text-3xl font-bold font-display ${t.items[1].color} mb-1`}>
                  {t.items[1].value}
                </div>
                <div className="text-xs font-semibold text-white/90 mb-1 uppercase tracking-wider">
                  {t.items[1].label}
                </div>
                <div className="text-xs text-gray-400 font-light">
                  {t.items[1].description}
                </div>
              </div>
            </motion.div>
          </ScrollReveal>

          {/* Small Items - 4 remaining items */}
          {t.items.slice(2).map((item, index) => (
            <ScrollReveal
              key={item.label}
              direction="up"
              delay={0.3 + index * 0.1}
              className="md:col-span-1 lg:col-span-1"
            >
              <motion.div
                initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                whileHover={prefersReducedMotion ? {} : { y: -4, scale: 1.02 }}
                className="h-full p-5 md:p-6 rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-white/5 hover:border-white/20 transition-all group relative overflow-hidden cursor-pointer"
              >
                <div className={`absolute inset-0 ${item.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl blur-xl`} aria-hidden="true" />
                <div className="relative z-10 text-center">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${item.bgColor} ${item.borderColor} border mb-3 group-hover:scale-110 transition-transform duration-300`}>
                    {React.createElement(item.icon, { className: `w-6 h-6 ${item.color}`, 'aria-hidden': true } as React.ComponentProps<'svg'>)}
                  </div>
                  <div className={`text-2xl font-bold font-display ${item.color} mb-1`}>
                    {item.value}
                  </div>
                  <div className="text-xs font-semibold text-white/90 mb-1 uppercase tracking-wider">
                    {item.label}
                  </div>
                  <div className="text-[10px] text-gray-400 font-light">
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
