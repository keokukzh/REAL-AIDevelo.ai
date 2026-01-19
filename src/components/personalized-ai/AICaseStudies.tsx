import React from 'react';
import { motion } from 'framer-motion';
import { Building2, Heart, DollarSign, Home, UtensilsCrossed } from 'lucide-react';
import { ScrollReveal } from '../webdesign/ScrollReveal';

interface CaseStudy {
  icon: React.ElementType;
  industry: string;
  title: string;
  description: string;
  results: string[];
}

interface AICaseStudiesProps {
  t: {
    caseStudiesTitle: string;
    caseStudiesSub: string;
    caseStudies: CaseStudy[];
  };
}

export const AICaseStudies: React.FC<AICaseStudiesProps> = ({ t }) => {
  return (
    <section
      id="case-studies"
      className="py-24 sm:py-32 bg-slate-950/30 relative overflow-hidden"
      aria-labelledby="case-studies-heading"
    >
      <div className="container mx-auto px-6 relative z-10">
        <ScrollReveal direction="up" className="text-center mb-16">
          <h2
            id="case-studies-heading"
            className="text-4xl md:text-6xl font-bold font-display mb-6 tracking-tight"
          >
            {t.caseStudiesTitle}
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto font-light">
            {t.caseStudiesSub}
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {t.caseStudies.map((study, index) => {
            const Icon = study.icon;
            return (
              <ScrollReveal key={index} direction="up" delay={index * 0.1}>
                <motion.div
                  whileHover={{ y: -8 }}
                  className="h-full p-8 rounded-3xl bg-slate-900/40 backdrop-blur-xl border border-white/5 hover:border-white/20 transition-all group"
                >
                  <div className="p-4 w-fit rounded-2xl bg-white/5 border border-white/10 group-hover:bg-swiss-red/10 group-hover:border-swiss-red/20 transition-colors mb-6">
                    <Icon className="w-8 h-8 text-swiss-red" />
                  </div>
                  <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-2">
                    {study.industry}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{study.title}</h3>
                  <p className="text-gray-400 mb-6 leading-relaxed font-light">
                    {study.description}
                  </p>
                  <ul className="space-y-2">
                    {study.results.map((result, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="text-swiss-red mt-1">▸</span>
                        <span>{result}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};
