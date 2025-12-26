import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholderColor?: string;
  className?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({ 
  src, 
  alt, 
  placeholderColor = 'bg-slate-900', 
  className = '', 
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden ${placeholderColor} ${className}`}
    >
      <AnimatePresence>
        {!isLoaded && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 z-10 ${placeholderColor} animate-pulse`}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {isInView && (
        <motion.img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.5 }}
          className={`w-full h-full object-cover ${className}`}
          {...(props as any)}
        />
      )}
    </div>
  );
};
