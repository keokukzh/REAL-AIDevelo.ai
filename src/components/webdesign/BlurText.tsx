import React from 'react';
import BlurTextComponent from '../BlurText';

interface BlurTextProps {
  text: string;
  animateBy?: 'words' | 'letters';
  direction?: 'top' | 'bottom';
  delay?: number;
  stepDuration?: number;
  className?: string;
  threshold?: number;
  rootMargin?: string;
  onAnimationComplete?: () => void;
  animationFrom?: any;
  animationTo?: any;
  easing?: (t: number) => number;
}

/**
 * BlurText Wrapper Component
 * 
 * Wraps the React Bits BlurText component for use in WebdesignPage.
 * Provides smooth blur-to-focus text animations.
 */
export const BlurText: React.FC<BlurTextProps> = (props) => {
  return <BlurTextComponent {...props} />;
};
