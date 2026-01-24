import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface BackToTopProps {
  className?: string;
  threshold?: number;
}

/**
 * Back to Top Button Component
 * Appears when user scrolls down, provides smooth scroll to top
 */
export const BackToTop: React.FC<BackToTopProps> = ({ 
  className = '',
  threshold = 400 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > threshold);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
          onClick={scrollToTop}
          className={`fixed bottom-8 right-8 z-50 bg-swiss-red hover:bg-red-700 text-white p-4 rounded-full shadow-lg shadow-swiss-red/30 transition-all focus-visible:ring-2 focus-visible:ring-swiss-red focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 min-h-[44px] min-w-[44px] flex items-center justify-center ${className}`}
          aria-label="Back to top"
        >
          <ArrowUp size={20} aria-hidden="true" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};
