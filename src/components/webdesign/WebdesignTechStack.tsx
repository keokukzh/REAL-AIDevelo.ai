import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ScrollReveal } from './ScrollReveal';
import { AnimatedList } from './AnimatedList';
import { Accordion } from './Accordion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const TECH_DICTIONARY = {
  de: {
    title: 'Moderne Technologien',
    sub: 'Wir verwenden nur die besten und modernsten Tools für Ihre Website.',
    items: [
      { name: 'React', description: 'Moderne Frontend-Bibliothek' },
      { name: 'TypeScript', description: 'Typsichere Entwicklung' },
      { name: 'Tailwind CSS', description: 'Utility-First CSS Framework' },
      { name: 'Vite', description: 'Schneller Build-Tool' },
      { name: 'Responsive Design', description: 'Mobile-First Ansatz' },
      { name: 'SEO-Optimiert', description: 'Suchmaschinen-freundlich' },
    ],
  },
  en: {
    title: 'Modern Technologies',
    sub: 'We use only the best and most modern tools for your website.',
    items: [
      { name: 'React', description: 'Modern Frontend Library' },
      { name: 'TypeScript', description: 'Type-Safe Development' },
      { name: 'Tailwind CSS', description: 'Utility-First CSS Framework' },
      { name: 'Vite', description: 'Fast Build Tool' },
      { name: 'Responsive Design', description: 'Mobile-First Approach' },
      { name: 'SEO Optimized', description: 'Search Engine Friendly' },
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
        <ScrollReveal direction="up" className="text-center mb-16">
          <h2 id="technologies-heading" className="text-4xl md:text-6xl font-bold font-display mb-6 tracking-tight">
            {t.title}
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto font-light">
            {t.sub}
          </p>
        </ScrollReveal>

        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {t.items.map((item, index) => (
              <ScrollReveal key={item.name} direction="up" delay={index * 0.1}>
                <motion.div
                  whileHover={prefersReducedMotion ? {} : { y: -4, scale: 1.02 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:border-white/20 transition-all group cursor-default"
                  style={{ transform: 'translateZ(0)' }}
                >
                  <div className="flex items-start gap-4">
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
