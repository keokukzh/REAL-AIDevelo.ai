import React from 'react';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

interface ShinyTextProps {
  children: React.ReactNode;
  className?: string;
  speed?: number;
}

/**
 * ShinyText Component from React Bits
 * Metallic sheen sweeps across text producing a reflective highlight
 */
export const ShinyText: React.FC<ShinyTextProps> = ({
  children,
  className = '',
  speed = 3,
}) => {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <span className={className}>{children}</span>;
  }

  return (
    <span
      className={`relative inline-block ${className}`}
      style={{
        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        animation: `shiny-sweep ${speed}s ease-in-out infinite`,
      }}
    >
      <style>{`
        @keyframes shiny-sweep {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
      {children}
    </span>
  );
};
