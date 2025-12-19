import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  index: number;
}

export const FeatureCard = React.memo<FeatureCardProps>(({ icon: Icon, title, description, index }) => {
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 hover:border-swiss-red/50 transition-all hover:shadow-lg hover:shadow-swiss-red/10"
      role="article"
      aria-labelledby={`feature-title-${index}`}
      aria-describedby={`feature-desc-${index}`}
    >
      <div className="w-12 h-12 bg-swiss-red/20 rounded-lg flex items-center justify-center mb-4" aria-hidden="true">
        <Icon className="w-6 h-6 text-swiss-red" aria-hidden="true" />
      </div>
      <h3 id={`feature-title-${index}`} className="text-xl font-semibold mb-2">
        {title}
      </h3>
      <p id={`feature-desc-${index}`} className="text-gray-400 text-sm leading-relaxed">
        {description}
      </p>
    </motion.article>
  );
});

FeatureCard.displayName = 'FeatureCard';
