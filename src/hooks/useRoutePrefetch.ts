import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ROUTES } from '../config/navigation';

/**
 * Hook to prefetch routes on hover/focus
 * Improves perceived performance by preloading routes
 */
export const useRoutePrefetch = () => {
  const location = useLocation();

  useEffect(() => {
    // Prefetch common routes
    const commonRoutes = [
      ROUTES.DASHBOARD,
      ROUTES.WEBDESIGN,
      ROUTES.LOGIN,
    ];

    // Prefetch routes after a short delay (don't block initial load)
    const timeoutId = setTimeout(() => {
      commonRoutes.forEach((route) => {
        if (route !== location.pathname) {
          // Use link prefetching
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = route;
          document.head.appendChild(link);
        }
      });
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [location.pathname]);
};

/**
 * Prefetch a specific route
 * @param route Route path to prefetch
 */
export const prefetchRoute = (route: string) => {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = route;
  document.head.appendChild(link);
};
