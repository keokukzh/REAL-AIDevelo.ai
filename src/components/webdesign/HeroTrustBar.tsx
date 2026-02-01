import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Zap, Shield, CheckCircle2 } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useMediaQuery } from '../../hooks/useMediaQuery';

interface TrustBadge {
  icon: React.ElementType;
  text: string;
  color: string;
  tooltip?: string;
}

const TRUST_BADGES: TrustBadge[] = [
  {
    icon: Award,
    text: '100/100 Lighthouse-Score',
    color: 'text-emerald-400',
    tooltip: 'Messbar schneller als 95% der Konkurrenz – steigert Conversion um bis zu 20%',
  },
  {
    icon: Zap,
    text: '< 1 Sekunde Ladezeit',
    color: 'text-blue-400',
    tooltip: 'Optimiert für Performance – Ihre Besucher warten nicht',
  },
  {
    icon: Shield,
    text: 'DSGVO-konform & sicher gehostet',
    color: 'text-purple-400',
    tooltip: 'Ihre Daten sind sicher – Schweizer Datenschutzstandards',
  },
  {
    icon: CheckCircle2,
    text: 'Made in Switzerland',
    color: 'text-swiss-red',
    tooltip: 'Schweizer Qualität – persönliche Betreuung aus der Schweiz',
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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section
      className="py-8 sm:py-12 relative overflow-hidden"
      aria-label="Trust Indicators"
    >
      <div className="container mx-auto px-4 sm:px-6">
        {isMobile ? (
          // Mobile: 2x2 Grid
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            {TRUST_BADGES.map((badge, index) => {
              const Icon = badge.icon;
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
                  className="flex flex-col items-center gap-2 px-4 py-3 rounded-xl bg-slate-900/40 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all cursor-default"
                >
                  <Icon size={20} className={badge.color} />
                  <span className="text-xs text-center text-gray-200 font-medium leading-tight">
                    {badge.text}
                  </span>
                </motion.div>
              );
            })}
          </div>
        ) : (
          // Desktop: Horizontal Row with Dividers
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {TRUST_BADGES.map((badge, index) => {
              const Icon = badge.icon;
              const isLast = index === TRUST_BADGES.length - 1;

              return (
                <React.Fragment key={index}>
                  <motion.div
                    initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
                    whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{
                      duration: 0.5,
                      delay: index * 0.1,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    whileHover={prefersReducedMotion ? {} : { scale: 1.05, y: -2 }}
                    onHoverStart={() => setHoveredIndex(index)}
                    onHoverEnd={() => setHoveredIndex(null)}
                    className="relative flex items-center gap-3 px-4 py-2 rounded-lg bg-slate-900/40 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all cursor-pointer group"
                    aria-label={badge.tooltip || badge.text}
                  >
                    <Icon size={18} className={badge.color} />
                    <span className="text-sm text-gray-200 font-medium whitespace-nowrap">
                      {badge.text}
                    </span>
                    {/* Tooltip */}
                    {badge.tooltip && hoveredIndex === index && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-2 bg-slate-800 border border-white/20 rounded-lg text-xs text-gray-300 whitespace-nowrap z-50 shadow-xl max-w-xs"
                        role="tooltip"
                      >
                        {badge.tooltip}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800" />
                      </motion.div>
                    )}
                  </motion.div>
                  {!isLast && (
                    <div className="h-8 w-px bg-white/10" aria-hidden="true" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
