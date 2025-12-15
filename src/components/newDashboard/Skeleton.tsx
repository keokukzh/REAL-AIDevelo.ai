import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}) => {
  const baseStyles = 'bg-slate-800/50 rounded';
  
  const variantStyles = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const animationStyles = {
    pulse: 'animate-skeleton',
    wave: 'animate-skeleton',
    none: '',
  };

  const style: React.CSSProperties = {
    width: width || (variant === 'text' ? '100%' : undefined),
    height: height || (variant === 'text' ? undefined : '1rem'),
  };

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${animationStyles[animation]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
};

// Predefined skeleton components for common use cases
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 ${className}`}>
    <Skeleton variant="text" width="60%" height={24} className="mb-4" />
    <Skeleton variant="text" width="100%" className="mb-2" />
    <Skeleton variant="text" width="80%" />
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; className?: string }> = ({ rows = 5, className = '' }) => (
  <div className={className}>
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton variant="rectangular" width="20%" height={40} />
          <Skeleton variant="rectangular" width="30%" height={40} />
          <Skeleton variant="rectangular" width="25%" height={40} />
          <Skeleton variant="rectangular" width="25%" height={40} />
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonStatCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-slate-900/50 p-6 rounded-xl border border-slate-700/50 ${className}`}>
    <div className="flex justify-between items-start mb-4">
      <Skeleton variant="circular" width={48} height={48} />
      <Skeleton variant="text" width={60} height={20} />
    </div>
    <Skeleton variant="text" width="40%" height={16} className="mb-2" />
    <Skeleton variant="text" width="60%" height={32} />
  </div>
);
