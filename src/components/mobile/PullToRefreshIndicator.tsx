import React from 'react';
import { RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  threshold: number;
  isRefreshing: boolean;
}

/**
 * Visual indicator for pull-to-refresh gesture
 */
export const PullToRefreshIndicator: React.FC<PullToRefreshIndicatorProps> = ({
  pullDistance,
  threshold,
  isRefreshing,
}) => {
  const progress = Math.min((pullDistance / threshold) * 100, 100);
  const shouldShow = pullDistance > 10 || isRefreshing;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center pt-4 pointer-events-none"
        >
          <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-full p-3 shadow-lg">
            <div className="relative w-10 h-10">
              <RefreshCw
                className={`w-6 h-6 text-accent transition-transform duration-300 ${
                  isRefreshing ? 'animate-spin' : ''
                }`}
                style={{
                  transform: isRefreshing
                    ? 'rotate(0deg)'
                    : `rotate(${progress * 1.8}deg)`,
                }}
              />
              {!isRefreshing && pullDistance < threshold && (
                <div className="absolute inset-0 rounded-full border-2 border-slate-700 border-t-accent" />
              )}
            </div>
            {isRefreshing && (
              <p className="text-xs text-gray-400 mt-2 text-center">Aktualisiere...</p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
