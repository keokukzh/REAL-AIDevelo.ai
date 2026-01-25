import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

interface SplitTextProps {
  children: string;
  className?: string;
  delay?: number;
  duration?: number;
  splitBy?: 'characters' | 'words';
}

/**
 * SplitText Component from React Bits
 * Splits text into characters / words for staggered entrance animation
 */
export const SplitText: React.FC<SplitTextProps> = ({
  children,
  className = '',
  delay = 50,
  duration = 0.5,
  splitBy = 'characters',
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion || !ref.current) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  const segments = splitBy === 'characters' ? children.split('') : children.split(' ');

  return (
    <span ref={ref} className={className}>
      {segments.map((segment, index) => (
        <span
          key={index}
          style={{
            display: 'inline-block',
            opacity: prefersReducedMotion || isVisible ? 1 : 0,
            transform: prefersReducedMotion || isVisible
              ? 'translateY(0)'
              : 'translateY(20px)',
            transition: prefersReducedMotion
              ? 'none'
              : `opacity ${duration}s ease-out ${(index * delay) / 1000}s, transform ${duration}s ease-out ${(index * delay) / 1000}s`,
          }}
        >
          {segment}
          {splitBy === 'words' && index < segments.length - 1 && '\u00A0'}
        </span>
      ))}
    </span>
  );
};
