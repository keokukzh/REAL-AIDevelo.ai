import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { faqs } from '../data/faq';
import { FaqItem } from '../types';
import { RevealSection } from './layout/RevealSection';

const AccordionItem: React.FC<{ item: FaqItem, isOpen: boolean, onClick: () => void }> = ({ item, isOpen, onClick }) => {
  return (
    <div className="border-b border-white/10">
      <button 
        onClick={onClick}
        className="w-full py-6 flex justify-between items-center text-left hover:text-accent transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black rounded"
      >
        <span className="text-lg font-medium text-gray-200">{item.question}</span>
        <span className="text-accent shrink-0 ml-4">
          {isOpen ? <Minus size={20} /> : <Plus size={20} />}
        </span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-gray-400 leading-relaxed">
              {item.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ProminentFAQItem: React.FC<{ item: FaqItem, index: number }> = ({ item, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-accent/30 transition-all"
    >
      <h3 className="text-lg font-semibold text-white mb-3">{item.question}</h3>
      <p className="text-gray-400 leading-relaxed">{item.answer}</p>
    </motion.div>
  );
};

export const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Top 5 FAQs (indices: 0, 1, 2, 3, and find "Was kostet die Telefonnummer?")
  const top5Indices = useMemo(() => {
    const indices = [0, 1, 2, 3]; // First 4 FAQs
    const phoneIndex = faqs.findIndex(faq => faq.question.includes('Telefonnummer'));
    if (phoneIndex !== -1 && !indices.includes(phoneIndex)) {
      indices.push(phoneIndex);
    }
    return indices.slice(0, 5);
  }, []);

  const top5FAQs = useMemo(() => faqs.filter((_, index) => top5Indices.includes(index)), [top5Indices]);
  const restFAQs = useMemo(() => faqs.filter((_, index) => !top5Indices.includes(index)), [top5Indices]);

  // Map rest FAQs to accordion indices
  const getAccordionIndex = (faqItem: FaqItem) => {
    return restFAQs.indexOf(faqItem);
  };

  return (
    <RevealSection className="py-24 bg-surface/30 section-spacing" id="faq">
      <div className="container mx-auto px-6 max-w-5xl">
        <RevealSection className="text-center mb-12" staggerDelay={0.05}>
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">Häufig gestellte Fragen</h2>
          <p className="text-gray-400">Die wichtigsten Fragen auf einen Blick</p>
        </RevealSection>
        
        {/* Top 5 FAQs - Prominent */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {top5FAQs.map((item, index) => (
            <ProminentFAQItem key={item.question} item={item} index={index} />
          ))}
        </div>

        {/* Rest FAQs - Accordion */}
        {restFAQs.length > 0 && (
          <div className="bg-black/40 backdrop-blur-sm rounded-3xl p-8 border border-white/5">
            <h3 className="text-xl font-semibold text-white mb-6">Weitere Fragen</h3>
            {restFAQs.map((item, index) => {
              const accordionIndex = getAccordionIndex(faqs.indexOf(item));
              return (
                <AccordionItem 
                  key={index} 
                  item={item} 
                  isOpen={openIndex === accordionIndex} 
                  onClick={() => setOpenIndex(openIndex === accordionIndex ? null : accordionIndex)} 
                />
              );
            })}
          </div>
        )}
      </div>
    </RevealSection>
  );
};