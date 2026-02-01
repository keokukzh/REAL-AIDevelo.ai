import React, { ReactNode } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface SectionTransitionProps {
  children: ReactNode;
  variant?: 'fade' | 'parallax' | 'slide';
  intensity?: 'subtle' | 'medium' | 'strong';
  className?: string;
}

/**
 * SectionTransition - Smooth transitions between sections
 * 
 * Features:
 * - Smooth fade transitions
 * - Parallax effects for depth
 * - Gradient overlays for visual continuity
 * - Scroll-triggered animations
 */
export const SectionTransition: React.FC<SectionTransitionProps> = ({
  children,
  variant = 'fade',
  intensity = 'medium',
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  
  // Only use scroll animations if not reduced motion
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
    layoutEffect: false,
  });

  // Intensity multipliers
  const intensityMap = {
    subtle: 0.3,
    medium: 0.5,
    strong: 0.8,
  };

  const multiplier = intensityMap[intensity];

  // Parallax transform - only create if not reduced motion
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReducedMotion ? [0, 0] : [30 * multiplier, -30 * multiplier]
  );

  // Opacity transform - only create if not reduced motion
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.2, 0.8, 1],
    prefersReducedMotion ? [1, 1, 1, 1] : [0.3, 1, 1, 0.3]
  );

  // Build motion props based on variant
  let motionProps: { y?: typeof y; opacity?: typeof opacity } = {};
  if (!prefersReducedMotion) {
    if (variant === 'parallax') {
      motionProps = { y };
    } else if (variant === 'fade') {
      motionProps = { opacity };
    } else if (variant === 'slide') {
      motionProps = { y, opacity };
    }
  }

  return (
    <motion.div
      ref={ref}
      {...motionProps}
      className={`relative ${className}`}
    >
      {/* Gradient overlay for visual continuity */}
      {!prefersReducedMotion && variant !== 'slide' && (
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: `linear-gradient(
              to bottom,
              transparent 0%,
              rgba(0, 0, 0, ${0.1 * multiplier}) 50%,
              transparent 100%
            )`,
          }}
        />
      )}
      {children}
    </motion.div>
  );
};
