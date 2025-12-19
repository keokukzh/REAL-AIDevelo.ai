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
  const logoSizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32'
  };

  const containerClass = fullScreen 
    ? 'fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center'
    : 'flex flex-col items-center justify-center p-8';

  return (
    <div className={containerClass}>
      <div className="flex flex-col items-center gap-4">
        {/* Premium Animated Logo with Multi-layer Effects */}
        <motion.div
          className={`${logoSizeClasses[size]} relative`}
          animate={{
            y: [0, -8, 0],
            scale: [1, 1.06, 1],
            rotate: [0, 1.5, -1.5, 0],
          }}
          transition={{
            y: {
              duration: 2.5,
              repeat: Infinity,
              ease: [0.4, 0, 0.6, 1],
            },
            scale: {
              duration: 2,
              repeat: Infinity,
              ease: [0.4, 0, 0.6, 1],
            },
            rotate: {
              duration: 4,
              repeat: Infinity,
              ease: [0.4, 0, 0.6, 1],
            }
          }}
        >
          {/* Outer Glow Layer */}
          <motion.div
            className="absolute inset-0 rounded-full bg-swiss-red/15 blur-2xl -z-10"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: [0.4, 0, 0.6, 1],
            }}
          />
          
          {/* Inner Glow Layer */}
          <motion.div
            className="absolute inset-0 rounded-full bg-swiss-red/25 blur-lg -z-5"
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: [0.4, 0, 0.6, 1],
              delay: 0.2,
            }}
          />

          {/* Logo Container with Shimmer */}
          <motion.div
            className="relative w-full h-full overflow-hidden rounded-lg"
            animate={{
              opacity: [0.95, 1, 0.95],
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            {/* Shimmer Effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -z-0"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'linear',
                repeatDelay: 0.5,
              }}
              style={{
                transform: 'skewX(-20deg)',
              }}
            />
            
            <img 
              src="/logo-thumbnail-white.png" 
              alt="AIDevelo" 
              className="w-full h-full object-contain relative z-10 drop-shadow-lg"
              onError={(e) => {
                // Fallback to studio logo if thumbnail not found
                const target = e.target as HTMLImageElement;
                target.src = '/logo-studio-white.png';
              }}
            />
          </motion.div>
        </motion.div>

        {/* Animated Loading Text */}
        <motion.div
          className="flex items-center gap-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <span className="text-gray-200 text-sm font-medium">{message}</span>
          <motion.span
            className="text-gray-200 text-sm font-medium"
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            ...
          </motion.span>
        </motion.div>
      </div>
    </div>
  );
};

