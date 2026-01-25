import React, { useRef, ReactNode } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ScrollCue } from './ScrollCue';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface HorizontalScrollTimelineProps {
  children: ReactNode;
  className?: string;
  showScrollCue?: boolean;
  snapType?: 'mandatory' | 'proximity' | 'none';
}

export const HorizontalScrollTimeline: React.FC<HorizontalScrollTimelineProps> = ({
  children,
  className = '',
  showScrollCue = true,
  snapType = 'mandatory',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollXProgress } = useScroll({
    container: scrollRef,
  });

  const snapClass = snapType === 'mandatory' 
    ? 'scroll-snap-type-x-mandatory' 
    : snapType === 'proximity'
    ? 'scroll-snap-type-x-proximity'
    : '';

  return (
    <div className={`relative ${className}`}>
      {showScrollCue && (
        <div className="mb-6 flex justify-center">
          <ScrollCue direction="horizontal" scrollRef={scrollRef} />
        </div>
      )}
      
      <div
        ref={scrollRef}
        className={`
          overflow-x-auto overflow-y-hidden
          ${snapClass}
          scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent
          pb-4
          ${prefersReducedMotion ? '' : 'scroll-smooth'}
        `}
        style={{
          scrollSnapType: snapType === 'mandatory' ? 'x mandatory' : snapType === 'proximity' ? 'x proximity' : 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div className="inline-flex gap-6 md:gap-8 min-w-full">
          {React.Children.map(children, (child, index) => (
            <div
              key={index}
              className="flex-shrink-0"
              style={{
                scrollSnapAlign: 'start',
              }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
