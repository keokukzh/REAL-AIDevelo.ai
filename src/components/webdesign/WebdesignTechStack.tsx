import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Zap, Code, FileCode, Palette, Zap as ZapIcon, Smartphone, Search } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';
import { AnimatedList } from './AnimatedList';
import { Accordion } from './Accordion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const TECH_DICTIONARY = {
  de: {
    title: 'Performance & Technologien',
    sub: 'Warum moderne Technologien für Ihr KMU wichtig sind: Speed, SEO und Wartbarkeit.',
    kmuText: 'Für Schweizer KMU bedeutet das: Schnellere Ladezeiten = mehr Conversions, bessere SEO = mehr Sichtbarkeit, sauberer Code = langfristig günstiger.',
    items: [
      { name: 'React', description: 'Moderne Frontend-Bibliothek', icon: Code },
      { name: 'TypeScript', description: 'Typsichere Entwicklung', icon: FileCode },
      { name: 'Tailwind CSS', description: 'Utility-First CSS Framework', icon: Palette },
      { name: 'Vite', description: 'Schneller Build-Tool', icon: ZapIcon },
      { name: 'Responsive Design', description: 'Mobile-First Ansatz', icon: Smartphone },
      { name: 'SEO-Optimiert', description: 'Suchmaschinen-freundlich', icon: Search },
    ],
  },
  en: {
    title: 'Performance & Technologies',
    sub: 'Why modern technologies matter for your SME: Speed, SEO, and maintainability.',
    kmuText: 'For Swiss SMEs, this means: Faster load times = more conversions, better SEO = more visibility, clean code = cheaper long-term.',
    items: [
      { name: 'React', description: 'Modern Frontend Library', icon: Code },
      { name: 'TypeScript', description: 'Type-Safe Development', icon: FileCode },
      { name: 'Tailwind CSS', description: 'Utility-First CSS Framework', icon: Palette },
      { name: 'Vite', description: 'Fast Build Tool', icon: ZapIcon },
      { name: 'Responsive Design', description: 'Mobile-First Approach', icon: Smartphone },
      { name: 'SEO Optimized', description: 'Search Engine Friendly', icon: Search },
    ],
  },
};

export const WebdesignTechStack: React.FC<{ lang?: 'de' | 'en' }> = ({ lang = 'de' }) => {
  const t = TECH_DICTIONARY[lang];
  const prefersReducedMotion = useReducedMotion();

  return (
    <section 
      id="technologies" 
      className="py-12 sm:py-20 relative overflow-hidden scroll-mt-20"
      role="region"
      aria-labelledby="technologies-heading"
    >
      <div className="container mx-auto px-6 relative z-20">
        <ScrollReveal direction="up" className="text-center mb-12">
          <h2 id="technologies-heading" className="text-4xl md:text-6xl font-bold font-display mb-6 tracking-tight">
            {t.title}
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto font-light mb-8">
            {t.sub}
          </p>
        </ScrollReveal>

        {/* Lighthouse Score Visualization */}
        <ScrollReveal direction="up" delay={0.2} className="max-w-3xl mx-auto mb-16">
          <motion.div
            whileHover={prefersReducedMotion ? {} : { y: -4, scale: 1.01 }}
            className="bg-gradient-to-br from-slate-900/60 to-slate-950/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-10 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition-opacity" />
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <Award className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-400 uppercase tracking-widest mb-1">Lighthouse Score</div>
                  <div className="text-4xl font-bold text-white">99/100</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-xs text-gray-400 uppercase tracking-wider">
                  <span>Performance</span>
                  <span className="text-emerald-400">99</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                    initial={{ width: 0 }}
                    whileInView={{ width: '99%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 uppercase tracking-wider">
                  <span>Accessibility</span>
                  <span className="text-emerald-400">100</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                    initial={{ width: 0 }}
                    whileInView={{ width: '100%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, delay: 0.2, ease: 'easeOut' }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 uppercase tracking-wider">
                  <span>Best Practices</span>
                  <span className="text-emerald-400">100</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                    initial={{ width: 0 }}
                    whileInView={{ width: '100%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, delay: 0.4, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </ScrollReveal>

        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {t.items.map((item, index) => (
              <ScrollReveal key={item.name} direction="up" delay={0.3 + index * 0.1}>
                <motion.div
                  whileHover={prefersReducedMotion ? {} : { y: -6, scale: 1.02 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:border-white/20 transition-all group cursor-default relative overflow-hidden"
                  style={{ transform: 'translateZ(0)' }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${index % 2 === 0 ? 'from-blue-500/5' : 'from-purple-500/5'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <div className="relative z-10 flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-white/5 border border-white/10 group-hover:bg-swiss-red/10 group-hover:border-swiss-red/20 transition-colors">
                      {React.createElement(item.icon, { size: 24, className: 'text-swiss-red' } as React.ComponentProps<'svg'>)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-swiss-red transition-colors duration-300">
                        {item.name}
                      </h3>
                      <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors duration-300">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>

          {/* KMU Text Section */}
          <ScrollReveal direction="up" delay={0.8} className="max-w-3xl mx-auto">
            <motion.div
              whileHover={prefersReducedMotion ? {} : { y: -2 }}
              className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-10 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-swiss-red/10 rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition-opacity" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <Zap className="w-6 h-6 text-swiss-red" />
                  <h3 className="text-xl font-bold text-white">Warum das für KMU wichtig ist</h3>
                </div>
                <p className="text-gray-300 leading-relaxed font-light">
                  {t.kmuText}
                </p>
              </div>
            </motion.div>
          </ScrollReveal>
          
          {/* Animated List Alternative View with Progressive Disclosure */}
          <div className="mt-12 max-w-2xl mx-auto">
            <ScrollReveal direction="up" delay={0.6}>
              <h3 className="text-2xl font-bold text-white mb-6 text-center">
                {lang === 'de' ? 'Technologie-Übersicht' : 'Technology Overview'}
              </h3>
              <Accordion
                items={[
                  {
                    id: 'list-view',
                    title: lang === 'de' ? 'Scrollbare Liste' : 'Scrollable List',
                    content: (
                      <AnimatedList
                        items={t.items.map(item => `${item.name} - ${item.description}`)}
                        showGradients={true}
                        enableArrowNavigation={true}
                        className="max-h-96"
                        itemClassName="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-xl p-4 hover:border-white/20 transition-all"
                        displayScrollbar={true}
                      />
                    ),
                  },
                ]}
                defaultOpen={['list-view']}
              />
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
};
