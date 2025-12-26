import React from 'react';

interface StatusIndicatorProps {
  status: 'online' | 'busy' | 'offline' | 'warning';
  label?: string;
  pulse?: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ 
  status, 
  label,
  pulse = false 
}) => {
  const getColor = () => {
    switch (status) {
      case 'online': return 'bg-[var(--term-text-success)]';
      case 'busy': return 'bg-[var(--term-text-warning)]';
      case 'offline': return 'bg-[var(--term-text-secondary)]';
      case 'warning': return 'bg-[var(--term-text-error)]';
    }
  };

  return (
    <div className="flex items-center gap-2 inline-flex font-mono-term text-xs">
      <span className={`relative flex h-2.5 w-2.5`}>
        {pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${getColor()}`}></span>
        )}
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${getColor()}`}></span>
      </span>
      {label && <span className="text-[var(--term-text-secondary)] uppercase tracking-wider">{label}</span>}
    </div>
  );
};
