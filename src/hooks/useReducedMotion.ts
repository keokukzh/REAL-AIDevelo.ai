import { useEffect, useState } from 'react';

/**
 * Hook to detect if user prefers reduced motion
 * Returns true if user has prefers-reduced-motion: reduce set
 */
export const useReducedMotion = (): boolean => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if matchMedia is available (SSR safety)
    if (typeof globalThis.window === 'undefined' || !globalThis.window.matchMedia) {
      return;
    }

    const mediaQuery = globalThis.window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Fallback for older browsers (deprecated but needed for compatibility)
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    else if (mediaQuery.addListener) {
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      mediaQuery.addListener(handleChange);
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return prefersReducedMotion;
};
