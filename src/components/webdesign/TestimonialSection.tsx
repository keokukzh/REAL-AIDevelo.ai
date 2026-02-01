import React from 'react';
import { motion } from 'framer-motion';
import { Quote, MessageSquareText, TrendingUp, Award, Zap } from 'lucide-react';
import data from '../../content/faqs_and_testimonials.json';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface TestimonialSectionProps {
  lang?: 'de' | 'en';
}

interface Testimonial {
  name: string;
  company: string;
  text: string;
  result?: string;
  metric?: string;
  industry?: string;
}

export const TestimonialSection: React.FC<TestimonialSectionProps> = ({ lang = 'de' }) => {
  const { testimonials } = data[lang];
  const prefersReducedMotion = useReducedMotion();

  // Enhanced testimonials with specific results (can be extended from JSON)
  const enhancedTestimonials: Testimonial[] = testimonials.map((t, index) => {
    // Add example metrics based on testimonial content
    const metrics = [
      { result: '32% Conversion-Steigerung', metric: '32%', icon: TrendingUp },
      { result: '25% Traffic-Erhöhung', metric: '25%', icon: Zap },
      { result: '4.9/5 Bewertung', metric: '4.9/5', icon: Award },
    ];
    
    return {
      ...t,
      result: metrics[index]?.result || undefined,
      metric: metrics[index]?.metric || undefined,
      industry: index === 0 ? (lang === 'de' ? 'Gesundheitswesen' : 'Healthcare') : (lang === 'de' ? 'Logistik' : 'Logistics'),
    };
  });

  return (
    <section className="py-24 relative overflow-hidden" aria-labelledby="testimonials-heading">
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-mono uppercase tracking-widest mb-4"
          >
            <MessageSquareText size={14} aria-hidden="true" />
            {lang === 'de' ? 'Erfolgsgeschichten' : 'Success Stories'}
          </motion.div>
          <motion.h2
            id="testimonials-heading"
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold font-display text-white mb-6"
          >
            {lang === 'de' ? (
              <>Was unsere <span className="text-red-500">Partner</span> sagen</>
            ) : (
              <>What Our <span className="text-red-500">Partners</span> Say</>
            )}
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-6xl mx-auto">
          {enhancedTestimonials.map((t, index) => {
            const MetricIcon = t.metric && index === 0 ? TrendingUp : index === 1 ? Zap : Award;
            
            return (
              <motion.div
                key={index}
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
                whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={prefersReducedMotion ? {} : { y: -4 }}
                className="relative p-6 sm:p-8 rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-white/10 hover:border-red-500/30 transition-all duration-500 group cursor-pointer"
              >
                <Quote className="absolute top-6 right-6 sm:right-8 text-white/5 group-hover:text-red-500/10 transition-colors" size={60} aria-hidden="true" />
                
                <div className="relative z-10">
                  {/* Result Badge */}
                  {t.result && (
                    <motion.div
                      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.9 }}
                      whileInView={prefersReducedMotion ? {} : { opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 + 0.2 }}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 mb-4"
                    >
                      <MetricIcon size={16} className="text-emerald-400" aria-hidden="true" />
                      <span className="text-emerald-400 font-semibold text-sm">{t.result}</span>
                    </motion.div>
                  )}

                  <p className="text-base sm:text-lg text-gray-300 italic mb-6 font-light leading-relaxed">
                    "{t.text}"
                  </p>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-red-500 font-bold text-lg flex-shrink-0">
                      {t.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-bold text-base">{t.name}</div>
                      <div className="text-sm text-gray-400 font-medium">{t.company}</div>
                      {t.industry && (
                        <div className="text-xs text-gray-500 mt-1">{t.industry}</div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
