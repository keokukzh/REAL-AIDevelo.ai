import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { FaqItem } from '../types';

const faqData: FaqItem[] = [
  {
    question: "Ist der Voice Agent wirklich menschlich klingend?",
    answer: "Ja. Wir nutzen die neueste Generation von Sprachmodellen. Der Agent atmet, macht Pausen und versteht Nuancen. 95% der Anrufer merken nicht, dass sie mit einer KI sprechen."
  },
  {
    question: "Wie schnell ist die Einrichtung?",
    answer: "Sehr schnell. Nach Ihrer Buchung erhalten Sie einen Fragebogen. Sobald wir diesen haben, ist Ihr Agent innerhalb von 24-48 Stunden einsatzbereit."
  },
  {
    question: "Kann der Agent Termine direkt in meinen Kalender eintragen?",
    answer: "Absolut. Wir integrieren uns in Google Calendar, Outlook, Calendly und viele branchenspezifische Lösungen (z.B. Salon-Software)."
  },
  {
    question: "Was passiert, wenn der Agent eine Frage nicht beantworten kann?",
    answer: "Der Agent ist so trainiert, dass er in solchen Fällen freundlich darauf hinweist, die Info weiterzugeben. Er sendet Ihnen sofort eine Zusammenfassung per SMS/Email, damit Sie persönlich zurückrufen können."
  },
  {
    question: "Wie funktioniert die 48h Aktion?",
    answer: "Wenn Sie sich innerhalb von 48h nach dem ersten Webseiten-Besuch für das Pro-Paket entscheiden, erhalten Sie den reduzierten Preis für die ersten 3 Monate und danach einen dauerhaften Rabatt."
  }
];

const AccordionItem: React.FC<{ item: FaqItem, isOpen: boolean, onClick: () => void }> = ({ item, isOpen, onClick }) => {
  return (
    <div className="border-b border-white/10">
      <button 
        onClick={onClick}
        className="w-full py-6 flex justify-between items-center text-left hover:text-accent transition-colors focus:outline-none"
      >
        <span className="text-lg font-medium text-gray-200">{item.question}</span>
        <span className="text-accent">
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

export const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 bg-surface/30" id="faq">
      <div className="container mx-auto px-6 max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">Häufig gestellte Fragen</h2>
        </div>
        
        <div className="bg-black/40 backdrop-blur-sm rounded-3xl p-8 border border-white/5">
          {faqData.map((item, index) => (
            <AccordionItem 
              key={index} 
              item={item} 
              isOpen={openIndex === index} 
              onClick={() => setOpenIndex(openIndex === index ? null : index)} 
            />
          ))}
        </div>
      </div>
    </section>
  );
};