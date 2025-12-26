import React from 'react';
import { motion } from 'framer-motion';
import { Quote, MessageSquareText } from 'lucide-react';
import data from '../../content/faqs_and_testimonials.json';

interface TestimonialSectionProps {
  lang?: 'de' | 'en';
}

export const TestimonialSection: React.FC<TestimonialSectionProps> = ({ lang = 'de' }) => {
  const { testimonials } = data[lang];

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-mono uppercase tracking-widest mb-4">
            <MessageSquareText size={14} aria-hidden="true" />
             Testimonials
          </div>
          <h2 className="text-4xl md:text-5xl font-bold font-display text-white mb-6">
            Was unsere <span className="text-red-500">Partner</span> sagen
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {testimonials.map((t, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative p-8 rounded-3xl bg-slate-900/50 border border-white/10 backdrop-blur-sm group hover:border-red-500/30 transition-all duration-500"
            >
              <Quote className="absolute top-6 right-8 text-white/5 group-hover:text-red-500/10 transition-colors" size={60} aria-hidden="true" />
              
              <div className="relative z-10">
                <p className="text-lg text-gray-300 italic mb-8 font-light leading-relaxed">
                  "{t.text}"
                </p>
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-red-500 font-bold">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-white font-bold">{t.name}</div>
                    <div className="text-sm text-gray-500 font-mono">{t.company}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
