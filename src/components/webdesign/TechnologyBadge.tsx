import React from 'react';
import { motion } from 'framer-motion';

interface TechnologyBadgeProps {
  name: string;
  description: string;
  index: number;
}

export const TechnologyBadge = React.memo<TechnologyBadgeProps>(({ name, description, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ 
        scale: 1.05,
        y: -5,
        borderColor: 'rgba(218, 41, 28, 0.5)',
        boxShadow: '0 10px 20px rgba(218, 41, 28, 0.2)'
      }}
      className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 text-center transition-all duration-300 relative overflow-hidden backdrop-blur-sm group"
      style={{ willChange: 'transform' }}
      role="listitem"
      aria-label={`Technologie: ${name}`}
    >
      {/* Glassmorphism Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      {/* Border Glow */}
      <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-swiss-red/30 to-transparent p-[1px]">
          <div className="h-full w-full rounded-lg bg-slate-900/50" />
        </div>
      </div>

      <div className="relative z-10">
        <div className="font-semibold text-white mb-1 group-hover:text-swiss-red transition-colors">{name}</div>
        <div className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">{description}</div>
      </div>
    </motion.div>
  );
});

TechnologyBadge.displayName = 'TechnologyBadge';
