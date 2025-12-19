import { useState, useEffect, useRef } from 'react';
import { useScroll, useMotionValueEvent } from 'framer-motion';

/**
 * Custom hook for managing Navbar UI state
 * Separates state management from navigation logic
 */
export const useNavbarState = () => {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [voiceAgentsDropdownOpen, setVoiceAgentsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  // Handle scroll-based visibility
  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previous = scrollY.getPrevious() || 0;
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
    if (latest > 50) {
      setScrolled(true);
    } else {
      setScrolled(false);
    }
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setVoiceAgentsDropdownOpen(false);
      }
    };

    if (voiceAgentsDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [voiceAgentsDropdownOpen]);

  return {
    hidden,
    scrolled,
    mobileMenuOpen,
    setMobileMenuOpen,
    voiceAgentsDropdownOpen,
    setVoiceAgentsDropdownOpen,
    dropdownRef,
  };
};
