import React from 'react';
import { motion } from 'framer-motion';

interface ProcessStepCardProps {
  number: string;
  title: string;
  description: string;
  isLast: boolean;
  index: number;
}

export const ProcessStepCard = React.memo<ProcessStepCardProps>(({ number, title, description, isLast, index }) => {
  return (
    <div className="relative">
      <motion.article
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6, delay: index * 0.1 }}
        className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 hover:border-swiss-red/50 transition-colors h-full"
        role="article"
        aria-labelledby={`process-title-${index}`}
        aria-describedby={`process-desc-${index}`}
      >
        <div className="text-4xl font-bold text-swiss-red/30 mb-4" aria-hidden="true">
          {number}
        </div>
        <h3 id={`process-title-${index}`} className="text-xl font-semibold mb-3">
          {title}
        </h3>
        <p id={`process-desc-${index}`} className="text-gray-400 text-sm leading-relaxed">
          {description}
        </p>
      </motion.article>
      {!isLast && (
        <div 
          className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10"
          aria-hidden="true"
        >
          <div className="w-6 h-0.5 bg-swiss-red/30" />
        </div>
      )}
    </div>
  );
});

ProcessStepCard.displayName = 'ProcessStepCard';
