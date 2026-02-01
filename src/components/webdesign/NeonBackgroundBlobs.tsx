import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * NeonBackgroundBlobs - Animierte Hintergrund-Blobs mit Cyan/Violett-Glow
 * Langsame, subtile Animationen für futuristischen Look
 */
export const NeonBackgroundBlobs: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();

  // Blob 1: Cyan (oben links)
  const blob1Variants = {
    animate: prefersReducedMotion
      ? {}
      : {
          scale: [1, 1.2, 1],
          x: [0, 30, 0],
          y: [0, -20, 0],
          opacity: [0.3, 0.5, 0.3],
        },
  };

  // Blob 2: Violett (unten rechts)
  const blob2Variants = {
    animate: prefersReducedMotion
      ? {}
      : {
          scale: [1, 1.3, 1],
          x: [0, -25, 0],
          y: [0, 25, 0],
          opacity: [0.25, 0.45, 0.25],
        },
  };

  // Blob 3: Cyan-Violett Mix (Mitte rechts)
  const blob3Variants = {
    animate: prefersReducedMotion
      ? {}
      : {
          scale: [1, 1.15, 1],
          x: [0, 20, 0],
          y: [0, -15, 0],
          opacity: [0.2, 0.35, 0.2],
        },
  };

  const transition = {
    duration: prefersReducedMotion ? 0 : 15,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Cyan Blob - Top Left */}
      <motion.div
        className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/20 blur-[120px] rounded-full"
        variants={blob1Variants}
        animate="animate"
        transition={transition}
        style={{
          boxShadow: '0 0 200px 100px rgba(6, 182, 212, 0.15)',
          willChange: 'transform, opacity', // GPU-Optimierung
        }}
      />

      {/* Violet Blob - Bottom Right */}
      <motion.div
        className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-500/20 blur-[100px] rounded-full"
        variants={blob2Variants}
        animate="animate"
        transition={{ ...transition, delay: 2 }}
        style={{
          boxShadow: '0 0 200px 100px rgba(139, 92, 246, 0.15)',
          willChange: 'transform, opacity', // GPU-Optimierung
        }}
      />

      {/* Cyan-Violet Mix Blob - Middle Right */}
      <motion.div
        className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-gradient-to-br from-cyan-500/15 to-violet-500/15 blur-[90px] rounded-full"
        variants={blob3Variants}
        animate="animate"
        transition={{ ...transition, delay: 4 }}
        style={{
          boxShadow: '0 0 150px 80px rgba(6, 182, 212, 0.1), 0 0 150px 80px rgba(139, 92, 246, 0.1)',
          willChange: 'transform, opacity', // GPU-Optimierung
        }}
      />
    </div>
  );
};
