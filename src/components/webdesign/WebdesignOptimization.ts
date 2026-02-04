/**
 * WebdesignPage Performance Optimization Configuration
 * 
 * This module provides optimization strategies for the webdesign landing page:
 * - Lazy loading thresholds
 * - Image optimization hints
 * - Video preload strategies
 * - Animation performance budgets
 */

// Intersection Observer options for lazy loading sections
export const LAZY_LOAD_OPTIONS = {
  threshold: 0.1,
  rootMargin: '50px',
};

// Video optimization settings
export const VIDEO_OPTIMIZATION = {
  preload: 'metadata' as const,
  // Use WebP format when available, fallback to MP4
  formats: ['video/webp', 'video/mp4'],
  // Lazy load videos until they're in viewport
  lazyLoadThreshold: 0.3,
};

// Animation performance budgets
export const ANIMATION_BUDGETS = {
  // Fade/Opacity transitions (good performance)
  opacity: {
    duration: 0.6,
    delay: 0.1,
  },
  // Transform-based animations (GPU accelerated)
  transform: {
    duration: 0.8,
    delay: 0.15,
  },
  // Complex animations (reduced in low-motion mode)
  complex: {
    duration: 1.2,
    delay: 0.2,
  },
};

// Component memoization strategy
export const MEMOIZATION_STRATEGY = {
  // Memoize expensive list items
  portfolioCard: true,
  // Memoize sections that don't frequently update
  heroSection: false, // Frequently updates with language changes
  pricingSection: false, // Frequently updates with hover states
  // Cache expensive computations
  cacheFeatureList: true,
};

// Image optimization settings
export const IMAGE_OPTIMIZATION = {
  // Use modern formats with fallbacks
  formats: ['image/webp', 'image/jpeg'],
  // Responsive image sizes
  sizes: {
    mobile: '100vw',
    tablet: '50vw',
    desktop: '33vw',
  },
  // Lazy load images outside viewport
  loading: 'lazy' as const,
};

// Critical rendering path optimization
export const CRITICAL_PATH = {
  // Fonts: load critical fonts in <head>
  criticalFonts: ['font-display'],
  // CSS: inline critical above-the-fold styles
  inlineCritical: true,
  // JS: defer non-critical bundles
  deferNonCritical: true,
};

/**
 * Performance monitoring thresholds
 * These help identify when optimizations are needed
 */
export const PERFORMANCE_BUDGETS = {
  // Core Web Vitals targets
  lcp: 2500, // Largest Contentful Paint in ms (2.5s target)
  fid: 100,  // First Input Delay in ms (100ms target)
  cls: 0.1,  // Cumulative Layout Shift (0.1 target)
  
  // Page metrics
  ttfb: 600,  // Time to First Byte (600ms)
  fcp: 1800,  // First Contentful Paint (1.8s)
  si: 3400,   // Speed Index (3.4s)
};

/**
 * Scroll performance optimization
 * Uses requestAnimationFrame and passive listeners
 */
export const SCROLL_PERFORMANCE = {
  usePassiveListeners: true,
  useRAF: true,
  throttleDelay: 16, // ~60fps
  debounceDelay: 200,
};
