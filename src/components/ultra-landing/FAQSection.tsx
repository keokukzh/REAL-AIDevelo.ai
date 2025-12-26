import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

const faqItems = [
  {
    question: 'Wie lange dauert ein typisches Projekt?',
    answer:
      'Landing Pages sind in 2-3 Wochen live, komplexere Websites in 4-8 Wochen. Voice Agents können oft schon nach 1-2 Wochen erste Calls bearbeiten. Bei Enterprise-Projekten erstellen wir einen detaillierten Zeitplan nach dem Discovery-Call.',
  },
  {
    question: 'Arbeitet ihr nur mit DACH-Kunden?',
    answer:
      'Unser Fokus liegt auf DACH, aber wir arbeiten auch mit internationalen Teams – besonders wenn es um Tech-Startups oder englischsprachige Voice Agents geht. Die Zeitzone sollte einigermaßen überlappen.',
  },
  {
    question: 'Was passiert nach dem Launch?',
    answer:
      'Wir lassen euch nicht allein. Im Scale- und Enterprise-Tier ist Support inkludiert. Für Launch-Kunden bieten wir optionale Wartungspakete. Außerdem dokumentieren wir alles sauber, sodass ihr auch intern iterieren könnt.',
  },
  {
    question: 'Kann ich Webdesign und Voice Agent kombinieren?',
    answer:
      'Absolut – das ist sogar unser Sweet Spot. Eine Website die Leads generiert plus ein Voice Agent der qualifiziert und Termine bucht. Wir bieten Kombipakete im Enterprise-Tier.',
  },
  {
    question: 'Welche Telefonnummern kann der Voice Agent nutzen?',
    answer:
      'Wir können lokale Nummern in Deutschland, Österreich und der Schweiz bereitstellen. Auch bestehende Nummern können oft portiert werden. Die monatlichen Kosten für Telefonie werden transparent weitergegeben.',
  },
  {
    question: 'Wie sieht es mit Datenschutz/DSGVO aus?',
    answer:
      'Datenschutz ist bei uns kein Afterthought. Alle Systeme sind so gebaut, dass sie DSGVO-konform betrieben werden können. Bei Voice Agents informieren wir Anrufer über die Aufzeichnung. Wir beraten auch gerne zu AVV-Verträgen.',
  },
  {
    question: 'Was kostet eine Telefonnummer für den Voice Agent?',
    answer:
      'Deutsche Nummern kosten ca. 3-5€/Monat, Schweizer Nummern 15-25 CHF/Monat. Die Minutenpreise variieren je nach Provider (typisch 0.01-0.03€/Min für Inbound). Wir rechnen transparent ab.',
  },
  {
    question: 'Welche CRM-Systeme könnt ihr integrieren?',
    answer:
      'Wir haben Erfahrung mit HubSpot, Pipedrive, Salesforce, Notion, Airtable und vielen anderen. Grundsätzlich: Wenn es eine API hat, können wir es anbinden. Custom-Integrationen sind Teil unseres Angebots.',
  },
];

interface AccordionItemProps {
  item: (typeof faqItems)[0];
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ item, isOpen, onToggle, index }) => {
  return (
    <motion.div
      className="border-b border-ultra-border last:border-b-0"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
    >
      <button
        onClick={onToggle}
        className="w-full py-5 flex items-center justify-between text-left hover:text-white transition-colors ultra-focus group"
        aria-expanded={isOpen}
      >
        <span className="text-base md:text-lg font-medium text-gray-200 group-hover:text-white pr-4">
          {item.question}
        </span>
        <span className="text-cyan shrink-0 w-6 h-6 rounded-full bg-cyan/10 flex items-center justify-center group-hover:bg-cyan/20 transition-colors">
          {isOpen ? <Minus size={14} /> : <Plus size={14} />}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-gray-400 leading-relaxed">{item.answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 md:py-32 relative bg-panel/30">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Section header */}
        <div className="text-center mb-12 md:mb-16">
          <motion.span
            className="text-xs font-bold tracking-widest uppercase text-electric-blue mb-4 block"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            FAQ
          </motion.span>
          <motion.h2
            className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Häufig gestellte Fragen
          </motion.h2>
          <motion.p
            className="text-gray-400 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Die wichtigsten Antworten auf einen Blick.
          </motion.p>
        </div>

        {/* Accordion */}
        <div className="max-w-3xl mx-auto ultra-card rounded-2xl p-6 md:p-8">
          {faqItems.map((item, i) => (
            <AccordionItem
              key={i}
              item={item}
              index={i}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>

        {/* More questions CTA */}
        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-gray-500 text-sm">
            Noch Fragen?{' '}
            <a href="#contact" className="text-cyan hover:underline ultra-focus">
              Schreib uns direkt
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
};
