import React from 'react';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

interface SilkBackgroundProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Silk Background Component
 * Smooth waves background with soft lighting from React Bits
 */
export const SilkBackground: React.FC<SilkBackgroundProps> = ({ 
  className = '', 
  children 
}) => {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <div className={`relative ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950" />
        {children}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: `
            linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, transparent 50%),
            linear-gradient(225deg, rgba(99, 102, 241, 0.2) 0%, transparent 50%),
            linear-gradient(45deg, rgba(139, 92, 246, 0.15) 0%, transparent 50%)
          `,
          backgroundSize: '400% 400%',
          animation: 'silk-wave 25s ease infinite',
        }}
        aria-hidden="true"
      />
      <style>{`
        @keyframes silk-wave {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
      {children}
    </div>
  );
};
