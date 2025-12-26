import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export const DeviceMockup: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();

  const codeLines = [
    { width: '60%', color: 'bg-violet/60' },
    { width: '80%', color: 'bg-cyan/50' },
    { width: '45%', color: 'bg-electric-blue/50' },
    { width: '70%', color: 'bg-violet/40' },
    { width: '55%', color: 'bg-cyan/60' },
    { width: '90%', color: 'bg-electric-blue/40' },
    { width: '40%', color: 'bg-violet/50' },
    { width: '75%', color: 'bg-cyan/40' },
  ];

  return (
    <div className="relative w-full max-w-[280px] mx-auto">
      {/* Phone frame */}
      <div className="relative bg-panel rounded-[2.5rem] p-2 border border-ultra-border shadow-ultra-card">
        {/* Screen */}
        <div className="relative bg-obsidian rounded-[2rem] overflow-hidden aspect-[9/16]">
          {/* Status bar */}
          <div className="absolute top-0 inset-x-0 h-6 bg-panel/50 flex items-center justify-center">
            <div className="w-16 h-4 bg-obsidian rounded-full" />
          </div>

          {/* Screen content - scrolling code lines */}
          <div className="absolute inset-0 pt-8 px-3 overflow-hidden">
            <motion.div
              className="space-y-2"
              animate={
                !prefersReducedMotion
                  ? {
                      y: [0, -100, 0],
                    }
                  : undefined
              }
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              {[...codeLines, ...codeLines].map((line, i) => (
                <motion.div
                  key={i}
                  className={`h-2 rounded-full ${line.color}`}
                  style={{ width: line.width }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                />
              ))}
            </motion.div>

            {/* UI Elements overlay */}
            <div className="absolute bottom-8 inset-x-3 space-y-2">
              <div className="h-10 bg-gradient-to-r from-violet to-cyan rounded-lg opacity-80" />
              <div className="flex gap-2">
                <div className="flex-1 h-8 bg-panel rounded border border-ultra-border" />
                <div className="flex-1 h-8 bg-panel rounded border border-ultra-border" />
              </div>
            </div>
          </div>

          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-violet/10 via-transparent to-cyan/10 pointer-events-none" />
        </div>
      </div>

      {/* Floating elements */}
      {!prefersReducedMotion && (
        <>
          <motion.div
            className="absolute -top-4 -right-4 w-8 h-8 rounded-lg bg-gradient-to-br from-violet to-cyan shadow-glow-violet"
            animate={{ y: [0, -8, 0], rotate: [0, 10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-2 -left-4 w-6 h-6 rounded-full bg-cyan shadow-glow-cyan"
            animate={{ y: [0, 8, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
          />
        </>
      )}
    </div>
  );
};
