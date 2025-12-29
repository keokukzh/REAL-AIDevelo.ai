import React from 'react';
import { motion } from 'framer-motion';
import { ScrollReveal } from './ScrollReveal';

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

  return (
    <section id="technologies" className="py-12 sm:py-20 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <ScrollReveal direction="up" className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold font-display mb-6 tracking-tight">
            {t.title}
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto font-light">
            {t.sub}
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {t.items.map((item, index) => (
            <ScrollReveal key={item.name} direction="up" delay={index * 0.1}>
              <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:border-white/20 transition-all">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-2">{item.name}</h3>
                    <p className="text-gray-400 text-sm">{item.description}</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};
