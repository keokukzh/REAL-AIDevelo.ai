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
      className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 text-center hover:border-swiss-red/50 transition-colors"
      role="listitem"
      aria-label={`Technologie: ${name}`}
    >
      <div className="font-semibold text-white mb-1">{name}</div>
      <div className="text-xs text-gray-400">{description}</div>
    </motion.div>
  );
});

TechnologyBadge.displayName = 'TechnologyBadge';
