import { useEffect, useRef, useState } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  enabled?: boolean;
  threshold?: number; // Distance in pixels to trigger refresh
  resistance?: number; // Resistance factor (0-1)
}

/**
 * Hook for implementing pull-to-refresh functionality on mobile devices
 */
export const usePullToRefresh = ({
  onRefresh,
  enabled = true,
  threshold = 80,
  resistance = 0.5,
}: UsePullToRefreshOptions) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const element = elementRef.current || document.documentElement;
    let touchStartY = 0;
    let currentY = 0;
    let isPulling = false;

    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger if at the top of the page
      if (globalThis.scrollY > 10) return;
      
      touchStartY = e.touches[0].clientY;
      isPulling = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling) return;

      currentY = e.touches[0].clientY;
      const distance = currentY - touchStartY;

      // Only allow pulling down
      if (distance > 0 && globalThis.scrollY === 0) {
        e.preventDefault();
        const resistedDistance = distance * resistance;
        setPullDistance(resistedDistance);
      } else {
        setPullDistance(0);
        isPulling = false;
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling) return;

      const currentPullDistance = pullDistance;
      isPulling = false;

      if (currentPullDistance >= threshold) {
        setIsRefreshing(true);
        setPullDistance(0);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      } else {
        setPullDistance(0);
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, onRefresh, threshold, resistance, pullDistance]);

  return {
    isRefreshing,
    pullDistance,
    elementRef,
  };
};
