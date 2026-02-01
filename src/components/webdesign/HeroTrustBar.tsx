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
 * HeroTrustBar - Kompakte horizontale Trust-Bar mit 3-4 Badges
 * 
 * Features:
 * - Desktop: Reihe mit subtilen Dividers
 * - Mobile: 2x2 Grid
 * - whileInView Fade-in Animation mit Stagger
 * - Glassmorphism-Design
 */
export const HeroTrustBar: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <section
      className="py-8 sm:py-12 relative overflow-hidden border-b border-white/10"
      aria-label="Trust Metrics"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto">
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
                whileHover={prefersReducedMotion ? {} : { scale: 1.05, y: -2 }}
                className="text-center p-4 sm:p-6 rounded-xl bg-slate-900/40 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Icon size={18} className={metric.color} />
                </div>
                <div className={`text-2xl sm:text-3xl font-bold ${metric.color} mb-1`}>
                  {metric.value}
                </div>
                <div className="text-xs sm:text-sm text-gray-400 font-medium leading-tight">
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
