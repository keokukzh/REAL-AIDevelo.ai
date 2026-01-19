import React from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export interface TrendData {
  value: number;
  percentage: number;
  period: 'vs yesterday' | 'vs last week' | 'vs last month';
  isPositive: boolean;
}

export interface SparklineData {
  values: number[];
  labels?: string[];
}

interface EnhancedStatCardProps {
  label: string;
  value: string | number;
  trend?: TrendData;
  sparkline?: SparklineData;
  description?: string;
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
  onClick?: () => void;
  comparisonPeriod?: string;
}

/**
 * Mini Sparkline Component
 */
const Sparkline: React.FC<{ data: SparklineData; isPositive: boolean }> = ({ data, isPositive }) => {
  if (!data.values || data.values.length === 0) return null;

  const maxValue = Math.max(...data.values, 1);
  const minValue = Math.min(...data.values, 0);
  const range = maxValue - minValue || 1;

  // Normalize values to 0-100 for SVG
  const normalizedValues = data.values.map((v) => ((v - minValue) / range) * 100);

  const width = 80;
  const height = 24;
  const padding = 2;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Generate path for line chart
  const points = normalizedValues.map((value, index) => {
    const x = padding + (index / (normalizedValues.length - 1 || 1)) * chartWidth;
    const y = padding + chartHeight - (value / 100) * chartHeight;
    return `${x},${y}`;
  });

  const pathData = `M ${points.join(' L ')}`;

  return (
    <svg width={width} height={height} className="overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id={`sparkline-gradient-${isPositive ? 'up' : 'down'}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.3} />
          <stop offset="100%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path
        d={pathData}
        fill="none"
        stroke={isPositive ? '#10b981' : '#ef4444'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-300"
      />
      <path
        d={`${pathData} L ${padding + chartWidth},${padding + chartHeight} L ${padding},${padding + chartHeight} Z`}
        fill={`url(#sparkline-gradient-${isPositive ? 'up' : 'down'})`}
        opacity={0.2}
      />
    </svg>
  );
};

/**
 * Enhanced Stat Card with Trends, Sparklines, and Comparison
 */
export const EnhancedStatCard: React.FC<EnhancedStatCardProps> = ({
  label,
  value,
  trend,
  sparkline,
  description,
  icon: Icon,
  iconColor,
  bgColor,
  onClick,
  comparisonPeriod,
}) => {
  const hasTrend = trend !== undefined;
  const trendPercentage = trend?.percentage || 0;
  const isPositiveTrend = trend?.isPositive ?? true;
  const trendAbs = Math.abs(trendPercentage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className={`
        ultra-glass p-6 rounded-xl border border-slate-700/50
        transition-all duration-300 group
        ${onClick ? 'cursor-pointer hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 active:scale-[0.98] touch-manipulation' : ''}
      `}
      role={onClick ? 'button' : 'article'}
      aria-label={`${label}: ${value}${trend ? `, ${trend.percentage > 0 ? '+' : ''}${trend.percentage}% ${trend.period}` : ''}`}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      <div className="flex justify-between items-start mb-4">
        <div
          className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center border border-slate-700/30 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
        >
          <Icon className={`w-6 h-6 ${iconColor}`} aria-hidden="true" />
        </div>
        {hasTrend && (
          <div
            className={`
              flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border
              ${isPositiveTrend
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : trendAbs > 0
                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                  : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}
            `}
          >
            {trendAbs > 0 ? (
              isPositiveTrend ? (
                <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
              ) : (
                <ArrowDownRight className="w-3 h-3" aria-hidden="true" />
              )
            ) : (
              <Minus className="w-3 h-3" aria-hidden="true" />
            )}
            <span>{trendAbs > 0 ? `${isPositiveTrend ? '+' : ''}${trendAbs.toFixed(1)}%` : '0%'}</span>
          </div>
        )}
      </div>

      <div>
        <p className="text-gray-400 text-[10px] uppercase font-bold tracking-[0.1em] mb-1 opacity-70">
          {label}
        </p>
        <div className="flex items-baseline gap-2 mb-2">
          <p className="text-3xl font-bold font-display text-white group-hover:text-accent transition-colors duration-300">
            {value}
          </p>
        </div>

        {/* Trend Details */}
      {hasTrend && trend && (
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            {isPositiveTrend && <TrendingUp className="w-3 h-3 text-emerald-400" aria-hidden="true" />}
            {!isPositiveTrend && trendAbs > 0 && (
              <TrendingDown className="w-3 h-3 text-red-400" aria-hidden="true" />
            )}
            <span className="capitalize">{trend.period}</span>
          </div>
          {comparisonPeriod && (
            <>
              <span className="text-xs text-gray-600">•</span>
              <span className="text-xs text-gray-500">{comparisonPeriod}</span>
            </>
          )}
        </div>
      )}

        {/* Sparkline */}
        {sparkline?.values && sparkline.values.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-700/30">
            <Sparkline data={sparkline} isPositive={isPositiveTrend} />
          </div>
        )}

        {description && (
          <p className="text-[10px] text-gray-500 mt-2 font-medium flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
            {description}
          </p>
        )}
      </div>

      {/* Hover indicator */}
      {onClick && (
        <div className="mt-4 pt-3 border-t border-slate-700/30 opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-xs text-gray-500 text-center">Klicken für Details</p>
        </div>
      )}
    </motion.div>
  );
};
