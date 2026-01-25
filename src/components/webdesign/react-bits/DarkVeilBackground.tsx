import React from 'react';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

interface DarkVeilBackgroundProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * DarkVeil Background Component
 * Subtle dark background with smooth animation and postprocessing from React Bits
 */
export const DarkVeilBackground: React.FC<DarkVeilBackgroundProps> = ({ 
  className = '', 
  children 
}) => {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <div className={`relative ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
        {children}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          background: `
            radial-gradient(circle at 30% 40%, rgba(30, 41, 59, 0.6) 0%, transparent 50%),
            radial-gradient(circle at 70% 60%, rgba(15, 23, 42, 0.6) 0%, transparent 50%)
          `,
          backgroundSize: '200% 200%',
          animation: 'dark-veil-pulse 15s ease infinite',
        }}
        aria-hidden="true"
      />
      <style>{`
        @keyframes dark-veil-pulse {
          0%, 100% { 
            background-position: 0% 50%;
            opacity: 0.2;
          }
          50% { 
            background-position: 100% 50%;
            opacity: 0.3;
          }
        }
      `}</style>
      {children}
    </div>
  );
};
