import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const marqueeItems = [
  'DACH SMBs',
  '•',
  'Startups',
  '•',
  'Teams that need speed',
  '•',
  'React / Next.js',
  '•',
  'Voice AI',
  '•',
  'Automation',
  '•',
  'Conversion Optimization',
  '•',
  'Custom Integrations',
];

export const AnimatedMarquee: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();

  const content = (
    <div className="flex items-center gap-8 px-4">
      {marqueeItems.map((item, i) => (
        <span
          key={i}
          className={`whitespace-nowrap ${
            item === '•'
              ? 'text-violet text-xl'
              : 'text-sm md:text-base font-medium text-gray-400 uppercase tracking-wider'
          }`}
        >
          {item}
        </span>
      ))}
    </div>
  );

  return (
    <section className="py-8 md:py-12 border-y border-ultra-border bg-panel/30 overflow-hidden">
      <div className="relative">
        {/* Gradient masks */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-obsidian to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-obsidian to-transparent z-10 pointer-events-none" />

        {prefersReducedMotion ? (
          <div className="flex overflow-hidden">{content}</div>
        ) : (
          <motion.div
            className="flex"
            animate={{ x: ['0%', '-50%'] }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            {content}
            {content}
          </motion.div>
        )}
      </div>

      {/* Built for label */}
      <p className="text-center text-xs text-gray-600 mt-4 uppercase tracking-widest">Built for</p>
    </section>
  );
};
