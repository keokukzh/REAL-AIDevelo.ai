import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Safe anchor ID regex: only allows # followed by alphanumeric, underscore, hyphen
 * Prevents crashes from Supabase hash tokens like #access_token=... or #code=...
 */
const SAFE_ANCHOR_REGEX = /^#[A-Za-z][A-Za-z0-9_-]*$/;

// Store scroll positions for back/forward navigation
const scrollPositions = new Map<string, number>();

export const ScrollToTop = () => {
  const { pathname, hash, state } = useLocation();
  const prevPathnameRef = useRef<string>(pathname);

  useEffect(() => {
    // Save current scroll position before navigation
    if (prevPathnameRef.current && prevPathnameRef.current !== pathname) {
      scrollPositions.set(prevPathnameRef.current, window.scrollY);
    }
    prevPathnameRef.current = pathname;

    // Handle scroll target from navigation state (for section links)
    if (state && typeof state === 'object' && 'scrollTarget' in state) {
      const scrollTarget = state.scrollTarget as string;
      if (SAFE_ANCHOR_REGEX.test(scrollTarget)) {
        // Wait for page to render, then scroll
        requestAnimationFrame(() => {
          const element = document.querySelector(scrollTarget);
          if (element) {
            const headerOffset = 80;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({
              top: offsetPosition,
              behavior: "smooth"
            });
          }
        });
        return;
      }
    }

    // Handle hash navigation
    if (hash) {
      // Only attempt scroll if hash matches safe anchor pattern
      // Ignore Supabase auth tokens (#access_token=..., #code=...) to prevent crashes
      if (SAFE_ANCHOR_REGEX.test(hash)) {
        // Wait for page to render, then scroll
        requestAnimationFrame(() => {
          const element = document.querySelector(hash);
          if (element) {
            const headerOffset = 80;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({
              top: offsetPosition,
              behavior: "smooth"
            });
          }
        });
        return;
      }
      // If hash doesn't match safe pattern (e.g., #access_token=...), ignore it silently
    }

    // Restore scroll position if available (for back/forward navigation)
    const savedPosition = scrollPositions.get(pathname);
    if (savedPosition !== undefined) {
      window.scrollTo({
        top: savedPosition,
        behavior: 'auto', // Instant restore
      });
    } else {
      // Scroll to top for new pages
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  }, [pathname, hash, state]);

  return null;
};
