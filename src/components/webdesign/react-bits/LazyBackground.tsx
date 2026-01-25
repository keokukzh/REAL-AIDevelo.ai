import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

interface LazyBackgroundProps {
  children: React.ReactNode;
  className?: string;
  rootMargin?: string;
  threshold?: number;
}

/**
 * LazyBackground Component
 * Uses Intersection Observer to lazy load background components
 */
export const LazyBackground: React.FC<LazyBackgroundProps> = ({
  children,
  className = '',
  rootMargin = '200px',
  threshold = 0.1,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion || !ref.current) {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Load the background after a small delay to prioritize critical content
          setTimeout(() => setShouldLoad(true), 100);
          observer.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [rootMargin, threshold, prefersReducedMotion]);

  return (
    <div ref={ref} className={className}>
      {shouldLoad ? children : null}
    </div>
  );
};
