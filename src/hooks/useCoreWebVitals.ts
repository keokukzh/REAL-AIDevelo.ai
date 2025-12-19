import { useEffect } from 'react';

/**
 * Core Web Vitals metrics
 */
interface CoreWebVitals {
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
}

/**
 * Hook to track Core Web Vitals
 * Reports metrics to console and optionally to analytics service
 */
export const useCoreWebVitals = (onReport?: (metrics: CoreWebVitals) => void) => {
  useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    const metrics: CoreWebVitals = {};

    // Track Largest Contentful Paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        if (lastEntry) {
          metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
          if (onReport) onReport({ ...metrics });
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      // LCP not supported
    }

    // Track First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.processingStart && entry.startTime) {
            metrics.fid = entry.processingStart - entry.startTime;
            if (onReport) onReport({ ...metrics });
          }
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      // FID not supported
    }

    // Track Cumulative Layout Shift (CLS)
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as any[];
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            metrics.cls = clsValue;
            if (onReport) onReport({ ...metrics });
          }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      // CLS not supported
    }

    // Track First Contentful Paint (FCP)
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.name === 'first-contentful-paint') {
            metrics.fcp = entry.startTime;
            if (onReport) onReport({ ...metrics });
          }
        });
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
    } catch (e) {
      // FCP not supported
    }

    // Track Time to First Byte (TTFB)
    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        metrics.ttfb = navigation.responseStart - navigation.requestStart;
        if (onReport) onReport({ ...metrics });
      }
    } catch (e) {
      // TTFB not available
    }

    // Log metrics to console in development
    if (import.meta.env.DEV) {
      const logInterval = setInterval(() => {
        if (Object.keys(metrics).length > 0) {
          console.log('[Core Web Vitals]', metrics);
        }
      }, 5000);

      return () => {
        clearInterval(logInterval);
      };
    }
  }, [onReport]);
};
