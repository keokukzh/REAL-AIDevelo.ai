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
        {/* Animated Logo */}
        <motion.div
          className={`${sizeClasses[size]} relative`}
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{
            rotate: {
              duration: 2,
              repeat: Infinity,
              ease: 'linear'
            },
            scale: {
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut'
            }
          }}
        >
          <img 
            src="/logo-thumbnail-white.png" 
            alt="AIDevelo" 
            className="w-full h-full object-contain"
            onError={(e) => {
              // Fallback to studio logo if thumbnail not found
              const target = e.target as HTMLImageElement;
              target.src = '/logo-studio-white.png';
            }}
          />
        </motion.div>

        {/* Loading Text */}
        {message && (
          <motion.p
            className="text-white/80 text-sm font-medium"
            animate={{
              opacity: [0.5, 1, 0.5],
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

        {/* Loading Dots */}
        <div className="flex gap-2 mt-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-accent rounded-full"
              animate={{
                y: [0, -8, 0],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

