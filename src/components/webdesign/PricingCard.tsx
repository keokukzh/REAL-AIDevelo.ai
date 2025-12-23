import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface PricingFeature {
  text: string;
}

interface PricingCardProps {
  price: string;
  subtitle: string;
  disclaimer: string;
  features: PricingFeature[];
}

export const PricingCard = React.memo<PricingCardProps>(({ price, subtitle, disclaimer, features }) => {
  const [isHovered, setIsHovered] = useState(false);
  const leftColumnFeatures = features.slice(0, Math.ceil(features.length / 2));
  const rightColumnFeatures = features.slice(Math.ceil(features.length / 2));

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.8, type: 'spring', stiffness: 100 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ 
        y: -10,
        scale: 1.02,
        transition: { duration: 0.3 }
      }}
      className="bg-gradient-to-br from-swiss-red/20 to-red-900/20 border-2 border-swiss-red/30 rounded-2xl p-8 md:p-12 relative overflow-hidden group"
      aria-labelledby="pricing-heading"
      style={{ willChange: 'transform' }}
    >
      {/* Animated Decorative Elements */}
      <motion.div
        className="absolute top-0 right-0 w-64 h-64 bg-swiss-red/10 rounded-full blur-3xl"
        animate={isHovered ? { scale: 1.2, opacity: 0.3 } : { scale: 1, opacity: 0.2 }}
        transition={{ duration: 0.5 }}
        aria-hidden="true"
      />
      <motion.div
        className="absolute bottom-0 left-0 w-64 h-64 bg-red-900/10 rounded-full blur-3xl"
        animate={isHovered ? { scale: 1.2, opacity: 0.3 } : { scale: 1, opacity: 0.2 }}
        transition={{ duration: 0.5 }}
        aria-hidden="true"
      />

      {/* Shine Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={isHovered ? { x: ['-100%', '100%'] } : { x: '-100%' }}
          transition={{ duration: 1, ease: 'easeInOut' }}
        />
      </div>
      
      <div className="relative z-10">
        <div className="text-center mb-8">
          {/* Price with Pulse Animation */}
          <motion.div
            id="pricing-heading"
            className="text-6xl md:text-7xl font-bold font-display text-swiss-red mb-2 relative inline-block"
            animate={isHovered ? { 
              scale: [1, 1.05, 1],
              filter: ['brightness(1)', 'brightness(1.2)', 'brightness(1)']
            } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="relative z-10">{price}</span>
            <motion.div
              className="absolute inset-0 bg-swiss-red/20 rounded-lg blur-xl"
              animate={isHovered ? { scale: 1.5, opacity: [0.5, 0.8, 0.5] } : { scale: 1, opacity: 0.3 }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
          <p className="text-xl text-gray-300 mb-2">
            {subtitle}
          </p>
          <p className="text-sm text-gray-400">
            {disclaimer}
          </p>
        </div>
        
        {/* Features with Stagger Animation */}
        <ul className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto list-none" aria-label="Inkludierte Features">
          <li className="space-y-3">
            {leftColumnFeatures.map((feature, index) => (
              <motion.div
                key={`left-${index}`}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                className="flex items-start gap-3 group/feature"
              >
                <motion.div
                  animate={isHovered ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                </motion.div>
                <motion.span
                  className="text-gray-300 group-hover/feature:text-white transition-colors"
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  {feature.text}
                </motion.span>
              </motion.div>
            ))}
          </li>
          <li className="space-y-3">
            {rightColumnFeatures.map((feature, index) => (
              <motion.div
                key={`right-${index}`}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                className="flex items-start gap-3 group/feature"
              >
                <motion.div
                  animate={isHovered ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}}
                  transition={{ duration: 0.5, delay: (leftColumnFeatures.length + index) * 0.05 }}
                >
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                </motion.div>
                <motion.span
                  className="text-gray-300 group-hover/feature:text-white transition-colors"
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  {feature.text}
                </motion.span>
              </motion.div>
            ))}
          </li>
        </ul>
      </div>
    </motion.div>
  );
});

PricingCard.displayName = 'PricingCard';
