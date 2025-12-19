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
      {/* Animated Logo Only */}
      <motion.div
        className={`${logoSizeClasses[size]} relative`}
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut'
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
    </div>
  );
};

