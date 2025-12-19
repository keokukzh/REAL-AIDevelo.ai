import { useState, useEffect, RefObject } from 'react';

/**
 * Hook for lazy loading images
 * Uses Intersection Observer API to load images when they enter viewport
 */
export const useImageLazyLoad = (
  ref: RefObject<HTMLElement>,
  options?: IntersectionObserverInit
) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // If IntersectionObserver is not supported, load immediately
    if (!('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before element is visible
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref, options]);

  return { isVisible, hasLoaded, setHasLoaded };
};

/**
 * Get optimized image source with WebP/AVIF support
 * Returns the best format supported by the browser
 */
export const getOptimizedImageSrc = (
  src: string,
  options?: {
    format?: 'webp' | 'avif' | 'auto';
    width?: number;
    quality?: number;
  }
): string => {
  // If no optimization needed, return original
  if (!options || options.format === undefined) {
    return src;
  }

  // For now, return original (CDN or image service would handle format conversion)
  // In production, this would use a CDN like Cloudinary, Imgix, or Next.js Image
  return src;
};
