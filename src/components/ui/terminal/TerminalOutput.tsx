import React from 'react';

interface TerminalOutputProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

export const TerminalOutput: React.FC<TerminalOutputProps> = ({ 
  children, 
  variant = 'default',
  className = "" 
}) => {
  const getColor = () => {
    switch (variant) {
      case 'success': return 'text-[var(--term-text-success)]';
      case 'warning': return 'text-[var(--term-text-warning)]';
      case 'error': return 'text-[var(--term-text-error)]';
      case 'info': return 'text-[var(--term-text-secondary)]';
      default: return 'text-[var(--term-text-primary)] opacity-90';
    }
  };

  return (
    <div className={`font-mono-term text-sm md:text-base leading-relaxed mb-1 ${getColor()} ${className}`}>
      {children}
    </div>
  );
};
