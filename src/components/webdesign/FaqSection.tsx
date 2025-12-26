import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';
import faqData from '../../content/faqs_and_testimonials.json';

interface FaqSectionProps {
  lang?: 'de' | 'en';
}

export const FaqSection: React.FC<FaqSectionProps> = ({ lang = 'de' }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { faqs } = faqData[lang as keyof typeof faqData] || faqData.de;

  return (
    <section className="py-24 bg-slate-950/50 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs font-mono uppercase tracking-widest mb-4">
            <HelpCircle size={14} aria-hidden="true" />
            FAQ
          </div>
          <h2 className="text-4xl md:text-5xl font-bold font-display text-white mb-6">
            Häufig gestellte <span className="text-blue-500">Fragen</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto font-light">
            Alles, was Sie über unsere Webdesign-Prozesse wissen müssen.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq: any, index: number) => {
            const isExpanded = openIndex === index;
            return (
              <div 
                key={index}
                className="group border border-white/5 rounded-2xl bg-white/[0.02] overflow-hidden transition-all hover:border-white/10"
              >
                <button
                  onClick={() => setOpenIndex(isExpanded ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                  aria-expanded={isExpanded ? "true" : "false"}
                >
                  <span className="text-lg font-medium text-white group-hover:text-blue-400 transition-colors">
                    {faq.question}
                  </span>
                  <ChevronDown 
                    size={20} 
                    className={`text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-blue-500' : ''}`}
                    aria-hidden="true"
                  />
                </button>
                
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <div className="px-6 pb-6 text-gray-400 font-light leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-blue-600/5 rounded-full blur-[100px] -ml-32" />
    </section>
  );
};
