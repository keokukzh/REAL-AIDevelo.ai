import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LazyImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> {
  src: string;
  alt: string;
  placeholderColor?: string;
  className?: string;
  srcSet?: string;
  sizes?: string;
  webpSrc?: string;
  webpSrcSet?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({ 
  src, 
  alt, 
  placeholderColor = 'bg-slate-900', 
  className = '', 
  srcSet,
  sizes,
  webpSrc,
  webpSrcSet,
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
        <picture>
          {webpSrc && (
            <source
              srcSet={webpSrcSet || webpSrc}
              type="image/webp"
              sizes={sizes}
            />
          )}
          <motion.img
            src={src}
            srcSet={srcSet}
            sizes={sizes || '100vw'}
            alt={alt}
            onLoad={() => setIsLoaded(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: isLoaded ? 1 : 0 }}
            transition={{ duration: 0.5 }}
            className={`w-full h-full object-cover ${className}`}
            loading="lazy"
            {...(props as any)}
          />
        </picture>
      )}
    </div>
  );
};
