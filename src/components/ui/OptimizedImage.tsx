import React, { useState, useRef } from 'react';
import { useImageLazyLoad } from '../../hooks/useImageLazyLoad';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  srcSet?: string;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  placeholder?: string;
  fallback?: string;
  className?: string;
}

/**
 * Optimized image component with lazy loading and format support
 * Supports WebP/AVIF with fallbacks, lazy loading, and responsive images
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  srcSet,
  sizes,
  loading = 'lazy',
  placeholder,
  fallback,
  className = '',
  ...props
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const { isVisible } = useImageLazyLoad(imgRef, { rootMargin: '100px' });
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Determine image source
  const imageSrc = hasError && fallback ? fallback : src;
  const shouldLoad = loading === 'eager' || isVisible;

  // Generate srcSet for responsive images if not provided
  const responsiveSrcSet = srcSet || (sizes ? undefined : undefined);

  return (
    <img
      ref={imgRef}
      src={shouldLoad ? imageSrc : placeholder || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"%3E%3C/svg%3E'}
      alt={alt}
      srcSet={shouldLoad ? responsiveSrcSet : undefined}
      sizes={shouldLoad ? sizes : undefined}
      loading={loading}
      className={`${className} ${!isLoaded && placeholder ? 'blur-sm' : ''} transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      onLoad={() => setIsLoaded(true)}
      onError={() => {
        if (!hasError && fallback) {
          setHasError(true);
        }
      }}
      {...props}
    />
  );
};
