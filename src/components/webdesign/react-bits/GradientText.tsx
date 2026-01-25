import React from 'react';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  speed?: number;
  colors?: string[];
}

/**
 * GradientText Component from React Bits
 * Animated gradient sweep across live text with speed and color control
 */
export const GradientText: React.FC<GradientTextProps> = ({
  children,
  className = '',
  speed = 3,
  colors = ['#ffffff', '#DA291C', '#ffffff'],
}) => {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <span
        className={className}
        style={{
          background: `linear-gradient(90deg, ${colors.join(', ')})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {children}
      </span>
    );
  }

  return (
    <span
      className={className}
      style={{
        background: `linear-gradient(90deg, ${colors.join(', ')})`,
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        animation: `gradient-sweep ${speed}s ease-in-out infinite`,
      }}
    >
      <style>{`
        @keyframes gradient-sweep {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
      {children}
    </span>
  );
};
