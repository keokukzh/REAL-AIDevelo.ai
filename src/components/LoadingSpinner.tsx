import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Wird geladen...', 
  size = 'md',
  fullScreen = false 
}) => {
  const sizeClasses = {
    sm: 'w-48',
    md: 'w-64',
    lg: 'w-80'
  };

  const containerClass = fullScreen 
    ? 'fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center'
    : 'flex flex-col items-center justify-center p-8';

  return (
    <div className={containerClass}>
      <div className="flex flex-col items-center gap-6">
        {/* Progress Bar Container */}
        <div className={`${sizeClasses[size]} relative`}>
          {/* Background Track */}
          <div className="w-full h-2 bg-slate-800/50 rounded-full overflow-hidden border border-slate-700/50">
            {/* Animated Fill */}
            <motion.div
              className="h-full bg-gradient-to-r from-swiss-red via-red-600 to-swiss-red rounded-full"
              initial={{ width: '0%' }}
              animate={{ 
                width: ['0%', '100%'],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
                repeatType: 'reverse'
              }}
              style={{
                backgroundSize: '200% 100%',
              }}
            >
              {/* Shimmer Effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: 'linear'
                }}
              />
            </motion.div>
          </div>
          
          {/* Progress Indicator Dots */}
          <div className="absolute -top-1 left-0 w-full flex justify-between">
            {[0, 25, 50, 75, 100].map((percent) => (
              <motion.div
                key={percent}
                className="w-1.5 h-1.5 bg-slate-600 rounded-full"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: percent / 100,
                  ease: 'easeInOut'
                }}
              />
            ))}
          </div>
        </div>

        {/* Loading Text */}
        {message && (
          <motion.p
            className="text-white/80 text-sm font-medium"
            animate={{
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            {message}
          </motion.p>
        )}
      </div>
    </div>
  );
};

