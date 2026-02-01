import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface AnimatedHeadlineProps {
  lines: string[];
  className?: string;
}

/**
 * AnimatedHeadline - Headline mit Neon-Glow-Effekten und Scroll-Reveal-Animation
 * Matches animation style of rest of page (whileInView pattern)
 * Line 1: fade-in + slide-up
 * Line 2: mask/slide-from-left mit Neon-Glow-Linie
 * Line 3: verzögertes slide-up
 */
export const AnimatedHeadline: React.FC<AnimatedHeadlineProps> = ({ lines, className = '' }) => {
  const prefersReducedMotion = useReducedMotion();

  const viewportSettings = {
    once: true,
    amount: 0.3,
    margin: '-100px',
  };

  const defaultTransition = {
    duration: prefersReducedMotion ? 0 : 0.6,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  return (
    <h1 className={`text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold font-display text-white leading-[0.9] tracking-tight ${className}`}>
      {lines.map((line, index) => {
        // Line 2 (index 1) hat speziellen Neon-Glow-Effekt
        if (index === 1 && lines.length > 1) {
          return (
            <motion.span
              key={index}
              className="relative inline-block"
              initial={prefersReducedMotion ? { opacity: 1, x: 0, clipPath: 'inset(0 0% 0 0)' } : { opacity: 0, x: -50, clipPath: 'inset(0 100% 0 0)' }}
              whileInView={prefersReducedMotion ? {} : { opacity: 1, x: 0, clipPath: 'inset(0 0% 0 0)' }}
              viewport={viewportSettings}
              transition={{ ...defaultTransition, delay: 0.2 + index * 0.2 }}
              style={{ willChange: 'transform, opacity, clip-path' }} // GPU-Optimierung
            >
              <span className="relative z-10">{line}</span>
              {/* Neon-Glow-Linie unter dem Text */}
              <motion.span
                className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-violet-500 to-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.6),0_0_40px_rgba(139,92,246,0.4)]"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={viewportSettings}
                transition={{
                  delay: prefersReducedMotion ? 0 : 0.6,
                  duration: prefersReducedMotion ? 0 : 0.8,
                  ease: 'circOut',
                }}
                style={{ originX: 0, willChange: 'transform' }} // GPU-Optimierung
              />
            </motion.span>
          );
        }

        // Line 1 und Line 3: Standard-Animation
        return (
          <motion.span
            key={index}
            className="block"
            initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            viewport={viewportSettings}
            transition={{
              ...defaultTransition,
              delay: prefersReducedMotion ? 0 : 0.2 + index * 0.2,
            }}
            style={{ willChange: 'transform, opacity' }} // GPU-Optimierung
          >
            {line}
          </motion.span>
        );
      })}
    </h1>
  );
};
