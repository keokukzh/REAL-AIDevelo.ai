import React from 'react';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

interface AuroraBackgroundProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Aurora Background Component
 * Flowing aurora gradient background from React Bits
 */
export const AuroraBackground: React.FC<AuroraBackgroundProps> = ({ 
  className = '', 
  children 
}) => {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <div className={`relative ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950" />
        {children}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          background: `
            radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.4) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 20%, rgba(168, 85, 247, 0.3) 0%, transparent 50%)
          `,
          backgroundSize: '200% 200%',
          animation: 'aurora-flow 20s ease infinite',
        }}
        aria-hidden="true"
      />
      <style>{`
        @keyframes aurora-flow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
      {children}
    </div>
  );
};
