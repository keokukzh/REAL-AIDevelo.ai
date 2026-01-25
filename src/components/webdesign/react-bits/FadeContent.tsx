import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

interface FadeContentProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
  duration?: number;
  delay?: number;
  className?: string;
  threshold?: number;
  rootMargin?: string;
}

/**
 * FadeContent Component from React Bits
 * Simple directional fade / slide entrance / exit wrapper with threshold-based activation
 */
export const FadeContent: React.FC<FadeContentProps> = ({
  children,
  direction = 'up',
  distance = 30,
  duration = 0.5,
  delay = 0,
  className = '',
  threshold = 0.1,
  rootMargin = '0px',
}) => {
  const ref = useRef<HTMLDivElement>(null);
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
      { threshold, rootMargin }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [threshold, rootMargin, prefersReducedMotion]);

  const getTransform = () => {
    if (prefersReducedMotion || isVisible) {
      return 'translate(0, 0)';
    }

    switch (direction) {
      case 'up':
        return `translateY(${distance}px)`;
      case 'down':
        return `translateY(-${distance}px)`;
      case 'left':
        return `translateX(${distance}px)`;
      case 'right':
        return `translateX(-${distance}px)`;
      default:
        return `translateY(${distance}px)`;
    }
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: prefersReducedMotion ? 1 : (isVisible ? 1 : 0),
        transform: getTransform(),
        transition: prefersReducedMotion
          ? 'none'
          : `opacity ${duration}s ease-out ${delay}s, transform ${duration}s ease-out ${delay}s`,
      }}
    >
      {children}
    </div>
  );
};
