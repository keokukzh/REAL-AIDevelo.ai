import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * GridOverlay - Subtiles Grid-Pattern mit Parallax-Scrolling
 * Sehr geringe Opacity (0.05-0.1) für subtilen Effekt
 */
export const GridOverlay: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const { scrollY } = useScroll();
  
  // Parallax-Effekt beim Scrollen
  const y = useTransform(scrollY, [0, 1000], [0, -10]);

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none z-[1] opacity-[0.08]"
      style={prefersReducedMotion ? {} : { y }}
    >
      {/* Grid Pattern */}
      <div
        className="w-full h-full"
        style={{
          backgroundImage: `
            linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
      
      {/* Subtile Lines Overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(6, 182, 212, 0.05) 0%, transparent 50%),
            linear-gradient(to bottom, rgba(139, 92, 246, 0.05) 0%, transparent 50%)
          `,
        }}
      />
    </motion.div>
  );
};
