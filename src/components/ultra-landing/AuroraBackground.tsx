import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export const AuroraBackground: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="relative min-h-screen overflow-hidden bg-obsidian">
      {/* Base gradient mesh */}
      <div
        className={`absolute inset-0 bg-gradient-mesh ${!prefersReducedMotion ? 'ultra-aurora-bg' : ''}`}
        style={{ backgroundSize: '400% 400%' }}
      />

      {/* Animated orbs */}
      {!prefersReducedMotion && (
        <>
          <motion.div
            className="ultra-glow-orb w-[600px] h-[600px] bg-violet/30 -top-40 -left-40"
            animate={{
              x: [0, 100, 50, 0],
              y: [0, 50, 100, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="ultra-glow-orb w-[500px] h-[500px] bg-cyan/20 top-1/3 -right-20"
            animate={{
              x: [0, -80, -40, 0],
              y: [0, 80, 40, 0],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 2,
            }}
          />
          <motion.div
            className="ultra-glow-orb w-[400px] h-[400px] bg-electric-blue/20 bottom-20 left-1/4"
            animate={{
              x: [0, 60, 30, 0],
              y: [0, -60, -30, 0],
            }}
            transition={{
              duration: 22,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 4,
            }}
          />
        </>
      )}

      {/* Radial vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 0%, rgba(5,6,10,0.4) 70%, rgba(5,6,10,0.8) 100%)',
        }}
      />

      {/* Content layer */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};
