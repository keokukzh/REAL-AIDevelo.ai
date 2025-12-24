import React from 'react';
import { motion } from 'framer-motion';
import { Magnetic } from './Magnetic';

interface ProcessStepCardProps {
  number: string;
  title: string;
  description: string;
  isLast: boolean;
  index: number;
}

export const ProcessStepCard = React.memo<ProcessStepCardProps>(({ number, title, description, isLast, index }) => {
  return (
    <div className="relative group">
      <motion.article
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6, delay: index * 0.1 }}
        whileHover={{ 
          y: -5,
          borderColor: 'rgba(218, 41, 28, 0.5)',
          boxShadow: '0 20px 40px rgba(218, 41, 28, 0.15)'
        }}
        className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 transition-all duration-300 h-full relative overflow-hidden backdrop-blur-sm"
        style={{ willChange: 'transform' }}
        role="article"
        aria-labelledby={`process-title-${index}`}
        aria-describedby={`process-desc-${index}`}
      >
        {/* Glassmorphism Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        
        {/* Border Glow Effect */}
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-swiss-red/20 via-red-500/10 to-swiss-red/20 p-[1px]">
            <div className="h-full w-full rounded-xl bg-slate-900/50" />
          </div>
        </div>

        <div className="relative z-10">
          <Magnetic strength={0.4}>
            <motion.div
              className="text-4xl font-bold text-swiss-red/30 mb-4 group-hover:text-swiss-red/60 transition-colors"
              aria-hidden="true"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
            >
              {number}
            </motion.div>
          </Magnetic>
          <h3 id={`process-title-${index}`} className="text-xl font-semibold mb-3 group-hover:text-swiss-red transition-colors">
            {title}
          </h3>
          <p id={`process-desc-${index}`} className="text-gray-400 text-sm leading-relaxed group-hover:text-gray-300 transition-colors">
            {description}
          </p>
        </div>
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
