import React from 'react';
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
  const leftColumnFeatures = features.slice(0, Math.ceil(features.length / 2));
  const rightColumnFeatures = features.slice(Math.ceil(features.length / 2));

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.8 }}
      className="bg-gradient-to-br from-swiss-red/20 to-red-900/20 border-2 border-swiss-red/30 rounded-2xl p-8 md:p-12 relative overflow-hidden"
      aria-labelledby="pricing-heading"
    >
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-swiss-red/5 rounded-full blur-3xl -z-0" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-900/5 rounded-full blur-3xl -z-0" aria-hidden="true" />
      
      <div className="relative z-10">
        <div className="text-center mb-8">
          <div id="pricing-heading" className="text-6xl md:text-7xl font-bold font-display text-swiss-red mb-2">
            {price}
          </div>
          <p className="text-xl text-gray-300 mb-2">
            {subtitle}
          </p>
          <p className="text-sm text-gray-400">
            {disclaimer}
          </p>
        </div>
        
        <ul className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto list-none" aria-label="Inkludierte Features">
          <li className="space-y-3">
            {leftColumnFeatures.map((feature, index) => (
              <div key={`left-${index}`} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-gray-300">{feature.text}</span>
              </div>
            ))}
          </li>
          <li className="space-y-3">
            {rightColumnFeatures.map((feature, index) => (
              <div key={`right-${index}`} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-gray-300">{feature.text}</span>
              </div>
            ))}
          </li>
        </ul>
      </div>
    </motion.div>
  );
});

PricingCard.displayName = 'PricingCard';
