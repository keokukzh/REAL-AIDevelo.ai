import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface WaveformDemoProps {
  isPlaying?: boolean;
  barCount?: number;
}

export const WaveformDemo: React.FC<WaveformDemoProps> = ({ isPlaying = true, barCount = 24 }) => {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = isPlaying && !prefersReducedMotion;

  return (
    <div className="flex items-center justify-center gap-[2px] h-16">
      {Array.from({ length: barCount }).map((_, i) => {
        const delay = i * 0.05;
        const baseHeight = 8 + Math.sin(i * 0.5) * 4;
        const maxHeight = 24 + Math.cos(i * 0.3) * 16;

        return (
          <motion.div
            key={i}
            className="w-1 rounded-full bg-gradient-to-t from-violet to-cyan"
            initial={{ height: baseHeight }}
            animate={
              shouldAnimate
                ? {
                    height: [baseHeight, maxHeight, baseHeight],
                  }
                : { height: baseHeight }
            }
            transition={
              shouldAnimate
                ? {
                    duration: 0.8 + Math.random() * 0.4,
                    repeat: Infinity,
                    delay,
                    ease: 'easeInOut',
                  }
                : undefined
            }
            style={{ opacity: 0.7 + Math.random() * 0.3 }}
          />
        );
      })}
    </div>
  );
};
