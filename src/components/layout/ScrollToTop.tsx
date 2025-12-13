import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Safe anchor ID regex: only allows # followed by alphanumeric, underscore, hyphen
 * Prevents crashes from Supabase hash tokens like #access_token=... or #code=...
 */
const SAFE_ANCHOR_REGEX = /^#[A-Za-z][A-Za-z0-9_-]*$/;

export const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // Only attempt scroll if hash matches safe anchor pattern
      // Ignore Supabase auth tokens (#access_token=..., #code=...) to prevent crashes
      if (SAFE_ANCHOR_REGEX.test(hash)) {
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
      }
      // If hash doesn't match safe pattern (e.g., #access_token=...), ignore it silently
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
};
