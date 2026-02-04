import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, Shield, Award, Zap } from 'lucide-react';
import { Magnetic } from './Magnetic';
import { Button } from '../ui/Button';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { GlareHover, ElectricBorder } from './react-bits';

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
  const [showMore, setShowMore] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  
  // Show first 6-8 features, rest in accordion
  const visibleFeatures = features.slice(0, 6);
  const hiddenFeatures = features.slice(6);
  const leftColumnFeatures = visibleFeatures.slice(0, Math.ceil(visibleFeatures.length / 2));
  const rightColumnFeatures = visibleFeatures.slice(Math.ceil(visibleFeatures.length / 2));

  return (
    <ElectricBorder intensity={0.3}>
      <GlareHover intensity={0.3}>
        <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileHover={prefersReducedMotion ? {} : { 
          y: -8,
          scale: 1.01,
          transition: { duration: 0.3, ease: 'easeOut' }
        }}
        className="bg-gradient-to-br from-slate-900/70 to-slate-950/50 backdrop-blur-xl border-2 border-swiss-red/40 rounded-3xl p-8 md:p-12 relative overflow-hidden group shadow-premium-lg shadow-swiss-red/20 cursor-pointer hover:border-swiss-red/60 transition-all duration-300"
        aria-labelledby="pricing-heading"
        role="region"
        style={{ transform: 'translateZ(0)' }}
      >
      {/* Animated Decorative Elements */}
      {!prefersReducedMotion && (
        <>
          <motion.div
            className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-swiss-red/30 to-red-500/10 rounded-full blur-3xl"
            animate={isHovered ? { scale: 1.3, opacity: 0.4 } : { scale: 1, opacity: 0.25 }}
            transition={{ duration: 0.5 }}
            aria-hidden="true"
          />
          <motion.div
            className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-red-900/20 to-swiss-red/10 rounded-full blur-3xl"
            animate={isHovered ? { scale: 1.3, opacity: 0.35 } : { scale: 1, opacity: 0.2 }}
            transition={{ duration: 0.5 }}
            aria-hidden="true"
          />
        </>
      )}

      {/* Shine Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={isHovered ? { x: ['-100%', '100%'] } : { x: '-100%' }}
          transition={{ duration: 1, ease: 'easeInOut' }}
        />
      </div>
      
      <div className="relative z-10">
        <div className="text-center mb-10">
          {/* Enhanced Price Hero */}
          <motion.div
            id="pricing-heading"
            className="mb-6"
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-8xl md:text-9xl lg:text-[10rem] font-black font-display text-white mb-3 relative inline-block leading-none">
              <span className="relative z-10 bg-gradient-to-br from-white via-swiss-red via-40% to-white bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(218,41,28,0.3)]">
                {price}
              </span>
              {!prefersReducedMotion && (
                <motion.div
                  className="absolute inset-0 bg-swiss-red/20 rounded-full blur-3xl -z-10"
                  animate={isHovered ? { scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] } : { scale: 1, opacity: 0.2 }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              )}
            </div>
            <p className="text-2xl md:text-3xl text-gray-200 font-semibold mb-3">
              {subtitle}
            </p>
            <p className="text-base text-gray-400 mb-6">
              {disclaimer}
            </p>
            
            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              <motion.div
                whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300"
              >
                <Shield size={16} className="text-emerald-400" />
                <span>Made in Switzerland</span>
              </motion.div>
              <motion.div
                whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300"
              >
                <Award size={16} className="text-blue-400" />
                <span>Performance optimiert</span>
              </motion.div>
              <motion.div
                whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300"
              >
                <Zap size={16} className="text-purple-400" />
                <span>Transparentes Festpreis-Modell</span>
              </motion.div>
            </div>
          </motion.div>
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
                initial={prefersReducedMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={prefersReducedMotion ? {} : { duration: 0.5, delay: 0.4 + index * 0.1 }}
                className="flex items-start gap-3 group/feature"
              >
                <motion.div
                  animate={prefersReducedMotion || !isHovered ? {} : { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                  transition={prefersReducedMotion ? {} : { duration: 0.5, delay: (leftColumnFeatures.length + index) * 0.05 }}
                >
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                </motion.div>
                <motion.span
                  className="text-gray-300 group-hover/feature:text-white transition-colors"
                  whileHover={prefersReducedMotion ? {} : { x: 5 }}
                  transition={prefersReducedMotion ? {} : { duration: 0.2 }}
                >
                  {feature.text}
                </motion.span>
              </motion.div>
            ))}
          </li>
        </ul>

        {/* Accordion for Additional Features */}
        {hiddenFeatures.length > 0 && (
          <div className="mt-8 border-t border-white/10 pt-6">
            <motion.button
              onClick={() => setShowMore(!showMore)}
              className="w-full flex items-center justify-between text-left text-gray-300 hover:text-white transition-colors cursor-pointer"
              whileHover={prefersReducedMotion ? {} : { x: 4 }}
              aria-expanded={showMore}
              aria-controls="additional-features"
            >
              <span className="font-semibold">
                {showMore ? 'Weniger anzeigen' : `Mehr anzeigen (${hiddenFeatures.length} weitere Leistungen)`}
              </span>
              <motion.div
                animate={{ rotate: showMore ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown size={20} />
              </motion.div>
            </motion.button>
            
            <AnimatePresence>
              {showMore && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="grid md:grid-cols-2 gap-4 mt-6">
                    {hiddenFeatures.map((feature, index) => (
                      <motion.div
                        key={`hidden-${index}`}
                        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="flex items-start gap-3"
                      >
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <span className="text-gray-300 text-sm">{feature.text}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Enhanced CTA Button */}
        <div className="mt-12 text-center">
          <Magnetic strength={prefersReducedMotion ? 0 : 1.2}>
            <div className="relative inline-block">
              <Button
                onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
                variant="primary"
                className="bg-swiss-red hover:bg-red-700 text-white font-bold py-5 px-12 text-lg shadow-lg shadow-swiss-red/30 hover:shadow-xl hover:shadow-swiss-red/40 transition-all relative overflow-hidden group/cta"
                aria-label="Start project - Navigate to contact form"
              >
                Jetzt Projekt starten
              </Button>
              {/* Urgency pulse effect */}
              {!prefersReducedMotion && (
                <motion.span
                  className="absolute inset-0 bg-white/20 rounded-full pointer-events-none"
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  aria-hidden="true"
                />
              )}
            </div>
          </Magnetic>
        </div>
      </div>
        </motion.div>
      </GlareHover>
    </ElectricBorder>
  );
});

PricingCard.displayName = 'PricingCard';
