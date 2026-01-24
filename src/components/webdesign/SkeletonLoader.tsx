import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
  variant?: 'hero' | 'process' | 'preview' | 'pricing' | 'features' | 'tech';
  className?: string;
}

/**
 * Skeleton Loader Component
 * Provides loading placeholders matching the actual content structure
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  variant = 'hero', 
  className = '' 
}) => {
  const baseAnimation = {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  };

  switch (variant) {
    case 'hero':
      return (
        <div className={`min-h-[95vh] flex items-center justify-center ${className}`}>
          <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <motion.div className="h-8 w-48 bg-slate-800/50 rounded-lg" animate={baseAnimation} />
              <motion.div className="h-20 w-full bg-slate-800/50 rounded-lg" animate={baseAnimation} />
              <motion.div className="h-20 w-3/4 bg-slate-800/50 rounded-lg" animate={baseAnimation} />
              <motion.div className="h-6 w-full bg-slate-800/50 rounded-lg" animate={baseAnimation} />
              <motion.div className="h-6 w-2/3 bg-slate-800/50 rounded-lg" animate={baseAnimation} />
              <div className="flex gap-4 mt-8">
                <motion.div className="h-14 w-48 bg-slate-800/50 rounded-full" animate={baseAnimation} />
                <motion.div className="h-14 w-32 bg-slate-800/50 rounded-full" animate={baseAnimation} />
              </div>
            </div>
            <motion.div className="h-96 w-full bg-slate-800/50 rounded-2xl" animate={baseAnimation} />
          </div>
        </div>
      );

    case 'process':
      return (
        <div className={`py-32 ${className}`}>
          <div className="container mx-auto px-6">
            <div className="text-center mb-24 space-y-4">
              <motion.div className="h-6 w-32 bg-slate-800/50 rounded-full mx-auto" animate={baseAnimation} />
              <motion.div className="h-12 w-96 bg-slate-800/50 rounded-lg mx-auto" animate={baseAnimation} />
              <motion.div className="h-6 w-2/3 bg-slate-800/50 rounded-lg mx-auto" animate={baseAnimation} />
            </div>
            <div className="space-y-12">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-8">
                  <motion.div className="h-64 w-full md:w-1/2 bg-slate-800/50 rounded-2xl" animate={baseAnimation} />
                  <motion.div className="hidden md:block h-1 w-1 bg-slate-800/50 rounded-full" animate={baseAnimation} />
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'preview':
      return (
        <div className={`py-24 ${className}`}>
          <div className="container mx-auto px-6">
            <div className="text-center mb-16 space-y-4">
              <motion.div className="h-10 w-64 bg-slate-800/50 rounded-lg mx-auto" animate={baseAnimation} />
              <motion.div className="h-6 w-96 bg-slate-800/50 rounded-lg mx-auto" animate={baseAnimation} />
            </div>
            <div className="flex gap-12 overflow-hidden">
              {[1, 2, 3].map((i) => (
                <motion.div 
                  key={i} 
                  className="h-96 w-[450px] flex-shrink-0 bg-slate-800/50 rounded-3xl" 
                  animate={baseAnimation} 
                />
              ))}
            </div>
          </div>
        </div>
      );

    case 'pricing':
      return (
        <div className={`py-12 sm:py-20 ${className}`}>
          <div className="container mx-auto px-6">
            <div className="text-center mb-16 space-y-4">
              <motion.div className="h-12 w-80 bg-slate-800/50 rounded-lg mx-auto" animate={baseAnimation} />
              <motion.div className="h-6 w-96 bg-slate-800/50 rounded-lg mx-auto" animate={baseAnimation} />
            </div>
            <motion.div className="max-w-4xl mx-auto bg-slate-800/50 rounded-3xl p-12 space-y-8" animate={baseAnimation}>
              <div className="text-center space-y-4">
                <motion.div className="h-20 w-48 bg-slate-700/50 rounded-lg mx-auto" animate={baseAnimation} />
                <motion.div className="h-6 w-64 bg-slate-700/50 rounded-lg mx-auto" animate={baseAnimation} />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <motion.div key={i} className="h-6 bg-slate-700/50 rounded" animate={baseAnimation} />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      );

    case 'features':
      return (
        <div className={`py-24 sm:py-32 ${className}`}>
          <div className="container mx-auto px-6">
            <div className="text-center mb-20 space-y-4">
              <motion.div className="h-16 w-96 bg-slate-800/50 rounded-lg mx-auto" animate={baseAnimation} />
              <motion.div className="h-6 w-2/3 bg-slate-800/50 rounded-lg mx-auto" animate={baseAnimation} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <motion.div 
                  key={i} 
                  className={`h-64 bg-slate-800/50 rounded-[2.5rem] ${
                    i === 1 ? 'md:col-span-4 lg:col-span-3' : 
                    i === 2 ? 'md:col-span-2 lg:col-span-3' : 
                    'md:col-span-2 lg:col-span-2'
                  }`}
                  animate={baseAnimation} 
                />
              ))}
            </div>
          </div>
        </div>
      );

    case 'tech':
      return (
        <div className={`py-12 sm:py-20 ${className}`}>
          <div className="container mx-auto px-6">
            <div className="text-center mb-16 space-y-4">
              <motion.div className="h-12 w-80 bg-slate-800/50 rounded-lg mx-auto" animate={baseAnimation} />
              <motion.div className="h-6 w-96 bg-slate-800/50 rounded-lg mx-auto" animate={baseAnimation} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <motion.div 
                  key={i} 
                  className="h-32 bg-slate-800/50 rounded-2xl" 
                  animate={baseAnimation} 
                />
              ))}
            </div>
          </div>
        </div>
      );

    default:
      return (
        <motion.div 
          className={`h-96 bg-slate-800/50 rounded-lg ${className}`} 
          animate={baseAnimation} 
        />
      );
  }
};
