import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

interface AnimatedContentProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
  duration?: number;
  delay?: number;
  className?: string;
  once?: boolean;
  threshold?: number;
  rootMargin?: string;
  disappear?: boolean;
  easing?: string;
}

/**
 * AnimatedContent Component from React Bits
 * Wrapper that animates any children on scroll or mount with configurable options
 */
export const AnimatedContent: React.FC<AnimatedContentProps> = ({
  children,
  direction = 'up',
  distance = 50,
  duration = 0.6,
  delay = 0,
  className = '',
  once = true,
  threshold = 0.1,
  rootMargin = '0px',
  disappear = false,
  easing = 'ease-out',
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
          if (once) {
            observer.disconnect();
          }
        } else if (disappear && !once) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [threshold, rootMargin, once, disappear, prefersReducedMotion]);

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
          : `opacity ${duration}s ${easing} ${delay}s, transform ${duration}s ${easing} ${delay}s`,
        willChange: prefersReducedMotion || isVisible ? 'auto' : 'transform, opacity',
      }}
    >
      {children}
    </div>
  );
};
