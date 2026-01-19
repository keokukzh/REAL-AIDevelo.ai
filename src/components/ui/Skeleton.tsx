import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  variant?: 'text' | 'circular' | 'rectangular';
  animate?: boolean;
}

/**
 * Base Skeleton component with shimmer animation
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  rounded = 'md',
  variant = 'rectangular',
  animate = true,
}) => {
  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  const variantClasses = {
    text: 'h-4',
    circular: 'rounded-full',
    rectangular: '',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`
        relative overflow-hidden
        bg-slate-800/50
        ${roundedClasses[rounded]}
        ${variantClasses[variant]}
        ${animate ? 'animate-pulse' : ''}
        ${className}
      `}
      style={style}
      aria-hidden="true"
    >
      {animate && (
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-inherit"
          style={{
            animation: 'shimmer 2s infinite',
            transform: 'translateX(-100%)',
          }}
        />
      )}
    </div>
  );
};

/**
 * Skeleton for KPI/Stat Cards
 */
export const StatCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton width={120} height={16} rounded="md" />
        <Skeleton width={32} height={32} rounded="full" variant="circular" />
      </div>
      <Skeleton width={80} height={32} rounded="md" className="mb-2" />
      <Skeleton width={100} height={14} rounded="sm" />
    </div>
  );
};

/**
 * Skeleton for Table Rows
 */
export const TableRowSkeleton: React.FC<{ columns?: number; className?: string }> = ({
  columns = 4,
  className = '',
}) => {
  return (
    <tr className={className}>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-4">
          <Skeleton width={i === 0 ? 120 : i === columns - 1 ? 80 : 150} height={16} rounded="md" />
        </td>
      ))}
    </tr>
  );
};

/**
 * Skeleton for Table
 */
export const TableSkeleton: React.FC<{
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
}> = ({ rows = 5, columns = 4, showHeader = true, className = '' }) => {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm text-left">
        {showHeader && (
          <thead className="text-xs text-gray-400 uppercase bg-slate-800/50 border-b border-slate-700/50">
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-4 py-3 font-semibold">
                  <Skeleton width={100} height={14} rounded="sm" />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="divide-y divide-slate-800/50">
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Skeleton for Card with title and content
 */
export const CardSkeleton: React.FC<{
  showHeader?: boolean;
  showActions?: boolean;
  contentLines?: number;
  className?: string;
}> = ({ showHeader = true, showActions = false, contentLines = 3, className = '' }) => {
  return (
    <div className={`bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <Skeleton width={150} height={20} rounded="md" />
          {showActions && <Skeleton width={80} height={32} rounded="lg" />}
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: contentLines }).map((_, i) => (
          <Skeleton
            key={i}
            width={i === contentLines - 1 ? '80%' : '100%'}
            height={16}
            rounded="md"
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton for Calendar Event List
 */
export const CalendarEventSkeleton: React.FC<{ count?: number; className?: string }> = ({
  count = 3,
  className = '',
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-3 rounded-lg border border-slate-700/50 bg-slate-800/50"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton width={60} height={12} rounded="sm" />
                <Skeleton width={50} height={12} rounded="sm" />
              </div>
              <Skeleton width={120} height={16} rounded="md" />
              <Skeleton width={180} height={14} rounded="sm" />
            </div>
            <Skeleton width={16} height={16} rounded="sm" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton for Chart/Graph
 */
export const ChartSkeleton: React.FC<{ height?: number; className?: string }> = ({
  height = 320,
  className = '',
}) => {
  return (
    <div className={`relative ${className}`} style={{ height: `${height}px` }}>
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between pb-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} width={30} height={12} rounded="sm" />
        ))}
      </div>
      {/* Chart area */}
      <div className="ml-12 h-full relative">
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-px bg-slate-800/50" />
          ))}
        </div>
        {/* Bars/Lines placeholder */}
        <div className="absolute bottom-0 left-0 right-0 h-3/4 flex items-end justify-around gap-2 px-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton
              key={i}
              width="12%"
              height={`${Math.random() * 60 + 20}%`}
              rounded="md"
            />
          ))}
        </div>
        {/* X-axis labels */}
        <div className="absolute bottom-0 left-0 right-0 h-8 flex items-center justify-around px-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} width={40} height={12} rounded="sm" />
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Complete Dashboard Skeleton
 */
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full space-y-8">
      {/* Welcome Section */}
      <section>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex-1 space-y-3">
            <Skeleton width={300} height={36} rounded="md" />
            <Skeleton width={400} height={20} rounded="md" />
          </div>
          <Skeleton width={120} height={24} rounded="lg" />
        </div>
      </section>

      {/* KPI Cards */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </section>

      {/* Voice Agent Control Center Skeleton */}
      <section>
        <CardSkeleton showHeader={true} showActions={true} contentLines={0} className="min-h-[200px]" />
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        {/* Left Column */}
        <div className="xl:col-span-2 space-y-8">
          {/* Calendar Card */}
          <CardSkeleton showHeader={true} showActions={true} contentLines={4} />
          
          {/* Chart Card */}
          <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <Skeleton width={150} height={20} rounded="md" />
            </div>
            <ChartSkeleton height={320} />
          </div>

          {/* Recent Calls Table */}
          <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <Skeleton width={150} height={20} rounded="md" />
              <Skeleton width={80} height={32} rounded="lg" />
            </div>
            <TableSkeleton rows={5} columns={4} showHeader={true} />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <CardSkeleton showHeader={true} contentLines={4} />
          
          {/* System Health */}
          <CardSkeleton showHeader={true} contentLines={4} />
        </div>
      </div>
    </div>
  );
};

/**
 * Settings Page Skeleton
 */
export const SettingsPageSkeleton: React.FC = () => {
  return (
    <div className="p-8 max-w-[1600px] mx-auto w-full space-y-8">
      {/* Page Header */}
      <div className="space-y-2 mb-8">
        <Skeleton width={200} height={32} rounded="md" />
        <Skeleton width={400} height={16} rounded="sm" />
      </div>

      {/* Settings Cards */}
      {Array.from({ length: 5 }).map((_, i) => (
        <CardSkeleton
          key={i}
          showHeader={true}
          contentLines={i === 0 ? 2 : i === 1 ? 3 : 4}
          className="min-h-[150px]"
        />
      ))}
    </div>
  );
};

// Shimmer animation is handled via Tailwind's animate utility
// The animation is defined in the Tailwind config or via inline styles
