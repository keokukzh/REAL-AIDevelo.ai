import { useEffect, useRef, useCallback } from 'react';

/**
 * useWebdesignPerformance Hook
 * Monitors and optimizes rendering performance of the webdesign page
 */
export const useWebdesignPerformance = () => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const performanceMetricsRef = useRef({
    sectionLoadTimes: {} as Record<string, number>,
    largestContentfulPaint: 0,
    firstInputDelay: 0,
  });

  // Monitor Largest Contentful Paint
  useEffect(() => {
    try {
      const perfObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        performanceMetricsRef.current.largestContentfulPaint = lastEntry.startTime;
      });

      perfObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      return () => perfObserver.disconnect();
    } catch (e) {
      // PerformanceObserver not supported
    }
  }, []);

  // Monitor First Input Delay
  useEffect(() => {
    try {
      const perfObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          // @ts-ignore - processingDuration is not in PerformanceEntry
          const fid = entry.processingDuration;
          if (fid > performanceMetricsRef.current.firstInputDelay) {
            performanceMetricsRef.current.firstInputDelay = fid;
          }
        });
      });

      perfObserver.observe({ entryTypes: ['first-input'] });

      return () => perfObserver.disconnect();
    } catch (e) {
      // PerformanceObserver not supported
    }
  }, []);

  // Lazy load sections based on visibility
  const observeSection = useCallback((elementId: string) => {
    const element = document.getElementById(elementId);
    if (!element || observerRef.current === null) return;

    observerRef.current.observe(element);
  }, []);

  // Initialize Intersection Observer
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const startTime = performance.now();
            performanceMetricsRef.current.sectionLoadTimes[entry.target.id] = startTime;

            // Load background images or heavy content when visible
            const bgElement = entry.target.querySelector('[data-lazy-bg]');
            if (bgElement && bgElement instanceof HTMLElement) {
              const bgImage = bgElement.getAttribute('data-lazy-bg');
              if (bgImage) {
                bgElement.style.backgroundImage = `url('${bgImage}')`;
              }
            }
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
      }
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Return metrics and utilities
  return {
    metrics: performanceMetricsRef.current,
    observeSection,
    getLCP: () => performanceMetricsRef.current.largestContentfulPaint,
    getFID: () => performanceMetricsRef.current.firstInputDelay,
  };
};

/**
 * useScrollPerformance Hook
 * Optimizes scroll event handling with throttling
 */
export const useScrollPerformance = (callback: (scrollY: number) => void, delay = 16) => {
  const lastCallRef = useRef(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    const handleScroll = () => {
      const now = Date.now();

      if (now - lastCallRef.current >= delay) {
        lastCallRef.current = now;

        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }

        rafRef.current = requestAnimationFrame(() => {
          callback(window.scrollY);
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [callback, delay]);
};

/**
 * useImageOptimization Hook
 * Handles responsive image loading and format selection
 */
export const useImageOptimization = (imageUrl: string) => {
  const getOptimizedImageUrl = useCallback(
    (width: number, quality: number = 80) => {
      // Example with a image CDN like imgix or Cloudinary
      // Modify based on your actual image service
      const params = new URLSearchParams({
        w: width.toString(),
        q: quality.toString(),
        auto: 'format', // Automatically use best format
      });

      return `${imageUrl}?${params.toString()}`;
    },
    [imageUrl]
  );

  return { getOptimizedImageUrl };
};
