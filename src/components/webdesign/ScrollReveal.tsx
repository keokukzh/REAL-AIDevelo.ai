import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade';
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
  margin?: string;
  stagger?: boolean;
  staggerDelay?: number;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  className = '',
  once = true,
  margin = '-100px',
  stagger = false,
  staggerDelay = 0.1,
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, margin });
  const prefersReducedMotion = useReducedMotion();

  const getInitialProps = () => {
    if (prefersReducedMotion) {
      return { opacity: 1, y: 0, x: 0, scale: 1 };
    }

    switch (direction) {
      case 'up':
        return { opacity: 0, y: 50 };
      case 'down':
        return { opacity: 0, y: -50 };
      case 'left':
        return { opacity: 0, x: 50 };
      case 'right':
        return { opacity: 0, x: -50 };
      case 'scale':
        return { opacity: 0, scale: 0.9 };
      case 'fade':
        return { opacity: 0 };
      default:
        return { opacity: 0, y: 50 };
    }
  };

  const getAnimateProps = () => {
    if (prefersReducedMotion) {
      return { opacity: 1, y: 0, x: 0, scale: 1 };
    }
    return { opacity: 1, y: 0, x: 0, scale: 1 };
  };

  if (stagger && React.Children.count(children) > 1) {
    return (
      <div ref={ref} className={className}>
        {React.Children.map(children, (child, index) => (
          <motion.div
            key={index}
            initial={getInitialProps()}
            animate={isInView ? getAnimateProps() : getInitialProps()}
            transition={{
              duration: prefersReducedMotion ? 0 : duration,
              delay: prefersReducedMotion ? 0 : delay + index * staggerDelay,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {child}
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      initial={getInitialProps()}
      animate={isInView ? getAnimateProps() : getInitialProps()}
      transition={{
        duration: prefersReducedMotion ? 0 : duration,
        delay: prefersReducedMotion ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface ParallaxProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}

export const Parallax: React.FC<ParallaxProps> = ({
  children,
  speed = 0.5,
  className = '',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const prefersReducedMotion = useReducedMotion();

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReducedMotion ? [0, 0] : [0, speed * 100]
  );

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
};

