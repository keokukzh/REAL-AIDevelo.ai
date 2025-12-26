import { useState, useEffect } from 'react';

/**
 * Hook to detect if the user has requested reduced motion at the OS level.
 * Useful for disabling or simplifying complex animations.
 */
export const useReducedMotion = () => {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    // Set initial value
    setReducedMotion(mediaQuery.matches);

    // Listen for changes
    const listener = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  return reducedMotion;
};
