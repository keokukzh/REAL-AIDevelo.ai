import React from 'react';
import { motion } from 'framer-motion';
import { Award, Zap, Shield, CheckCircle2 } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useMediaQuery } from '../../hooks/useMediaQuery';

interface TrustMetric {
  value: string;
  label: string;
  color: string;
  icon: React.ElementType;
}

const TRUST_METRICS: TrustMetric[] = [
  {
    value: '50+',
    label: 'Schweizer KMU',
    color: 'text-white',
    icon: CheckCircle2,
  },
  {
    value: '25%',
    label: 'Durchschnittl. Conversion-Steigerung',
    color: 'text-emerald-400',
    icon: Zap,
  },
  {
    value: '4.9/5',
    label: 'Durchschnittl. Bewertung',
    color: 'text-cyan-400',
    icon: Award,
  },
  {
    value: '99+',
    label: 'Lighthouse Score',
    color: 'text-swiss-red',
    icon: Shield,
  },
];

/**
 * HeroTrustBar - Enhanced Trust Bar with improved visual weight and accessibility
 * 
 * Features:
 * - Desktop: 4-column grid with enhanced glassmorphism
 * - Mobile: 2x2 Grid with proper spacing
 * - Enhanced hover effects for engagement
 * - Proper contrast in light/dark modes
 * - Accessibility: ARIA labels, keyboard navigation
 * - Better visual weight with improved shadows and borders
 */
export const HeroTrustBar: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <section
      className="py-6 sm:py-8 relative overflow-hidden"
      aria-label="Trust Metrics"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto">
          {TRUST_METRICS.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={index}
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
                whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={prefersReducedMotion ? {} : { scale: 1.05, y: -4 }}
                className="text-center p-5 sm:p-7 rounded-xl bg-slate-900/60 dark:bg-white/80 backdrop-blur-xl border border-white/20 dark:border-gray-200 hover:border-white/40 dark:hover:border-gray-300 hover:shadow-lg hover:shadow-swiss-red/10 transition-all cursor-pointer group"
                tabIndex={0}
                role="article"
                aria-label={`${metric.value} ${metric.label}`}
              >
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Icon 
                    size={20} 
                    className={`${metric.color} group-hover:scale-110 transition-transform duration-300`}
                    aria-hidden="true"
                  />
                </div>
                <div className={`text-3xl sm:text-4xl font-bold ${metric.color} mb-2 group-hover:scale-105 transition-transform duration-300`}>
                  {metric.value}
                </div>
                <div className="text-xs sm:text-sm text-gray-300 dark:text-slate-700 font-medium leading-tight group-hover:text-white dark:group-hover:text-slate-900 transition-colors">
                  {metric.label}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
