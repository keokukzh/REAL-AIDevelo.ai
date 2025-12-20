import React, { useRef, useEffect, useState } from 'react';
import { motion, useInView, Variants } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface RevealSectionProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number; // Delay between children (in seconds)
  threshold?: number; // Intersection threshold (0-1)
  id?: string;
}

const defaultVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.19, 1, 0.22, 1], // ease-out-expo
    },
  },
};

const reducedMotionVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2,
    },
  },
};

export const RevealSection: React.FC<RevealSectionProps> = ({
  children,
  className = '',
  staggerDelay = 0.1,
  threshold = 0.1,
  id,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { 
    once: true, 
    amount: threshold,
    margin: '0px 0px -10% 0px' // Trigger when 10% of element is visible
  });
  const prefersReducedMotion = useReducedMotion();
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    if (isInView && !shouldAnimate) {
      setShouldAnimate(true);
    }
  }, [isInView, shouldAnimate]);

  const variants = prefersReducedMotion ? reducedMotionVariants : defaultVariants;

  // Clone children and add stagger animation
  const childrenArray = React.Children.toArray(children);
  const animatedChildren = childrenArray.map((child, index) => {
    if (React.isValidElement(child)) {
      // Use child key if available, otherwise use index with prefix
      const childKey = child.key || `reveal-item-${index}`;
      return (
        <motion.div
          key={childKey}
          variants={variants}
          initial="hidden"
          animate={shouldAnimate ? 'visible' : 'hidden'}
          transition={{
            ...variants.visible?.transition,
            delay: prefersReducedMotion ? 0 : index * staggerDelay,
          }}
          style={{ willChange: shouldAnimate ? 'transform, opacity' : 'auto' }}
        >
          {child}
        </motion.div>
      );
    }
    return child;
  });

  return (
    <section
      ref={ref}
      id={id}
      className={className}
    >
      {animatedChildren}
    </section>
  );
};
