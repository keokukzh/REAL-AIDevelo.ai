import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface ScrollCueProps {
  direction?: 'horizontal' | 'vertical';
  showProgress?: boolean;
  className?: string;
  scrollRef?: React.RefObject<HTMLDivElement>;
}

export const ScrollCue: React.FC<ScrollCueProps> = ({
  direction = 'horizontal',
  showProgress = true,
  className = '',
  scrollRef,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const { scrollXProgress, scrollYProgress } = useScroll({
    container: scrollRef,
  });

  const progress = direction === 'horizontal' ? scrollXProgress : scrollYProgress;
  const progressWidth = useTransform(progress, [0, 1], ['0%', '100%']);

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <div className={`flex items-center gap-3 ${className}`} aria-hidden="true">
      {direction === 'horizontal' ? (
        <>
          <ChevronLeft size={20} className="text-white/40" />
          <span className="text-xs font-mono text-white/40 uppercase tracking-widest">
            Scroll →
          </span>
          <ChevronRight size={20} className="text-white/40" />
        </>
      ) : (
        <span className="text-xs font-mono text-white/40 uppercase tracking-widest">
          Scroll ↓
        </span>
      )}
      
      {showProgress && (
        <div className="flex-1 max-w-[200px] h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-swiss-red to-red-500 rounded-full"
            style={{ width: progressWidth }}
          />
        </div>
      )}
    </div>
  );
};
