import React, { useState, useEffect } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { SECTION_LINKS } from '../../config/navigation';
import { useNavigationWithLocation } from '../../hooks/useNavigation';

interface SectionNavProps {
  className?: string;
  variant?: 'sticky' | 'floating';
}

/**
 * Section navigation component for Landing Page
 * Provides progress indicator and smooth scroll navigation
 */
export const SectionNav: React.FC<SectionNavProps> = ({
  className = '',
  variant = 'sticky',
}) => {
  const { nav, location } = useNavigationWithLocation();
  const [activeSection, setActiveSection] = useState<string>('');
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Only show on landing page
  if (location.pathname !== '/') {
    return null;
  }

  // Track active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const sections = SECTION_LINKS.map((link) => link.href.substring(1));
      const scrollPosition = window.scrollY + 100; // Offset for header

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i]);
        if (section) {
          const sectionTop = section.offsetTop;
          if (scrollPosition >= sectionTop) {
            setActiveSection(`#${sections[i]}`);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSectionClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    nav.goToSection(href, location.pathname);
  };

  const containerClasses = variant === 'sticky'
    ? 'sticky top-20 z-40 bg-black/60 backdrop-blur-lg border-b border-white/10'
    : 'fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40 bg-black/80 backdrop-blur-lg border border-white/10 rounded-full px-4 py-2';

  return (
    <nav
      className={`${containerClasses} ${className}`}
      aria-label="Sektionsnavigation"
    >
      {/* Progress Indicator */}
      {variant === 'sticky' && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
          <motion.div
            className="h-full bg-swiss-red origin-left"
            style={{ scaleX }}
            aria-hidden="true"
          />
        </div>
      )}

      <div className={`container mx-auto px-6 ${variant === 'floating' ? 'px-4' : ''}`}>
        <ul
          className={`flex items-center gap-2 overflow-x-auto scrollbar-hide ${
            variant === 'floating' ? 'gap-1' : 'gap-4'
          }`}
          role="list"
        >
          {SECTION_LINKS.map((link) => {
            const isActive = activeSection === link.href;
            return (
              <li key={link.href}>
                <motion.a
                  href={link.href}
                  onClick={(e) => handleSectionClick(e, link.href)}
                  className={`
                    inline-block px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black
                    min-h-[44px] min-w-[44px] flex items-center justify-center
                    ${
                      isActive
                        ? 'text-white bg-white/10 border border-white/20'
                        : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }
                  `}
                  aria-label={`Zu ${link.name} Sektion navigieren`}
                  aria-current={isActive ? 'page' : undefined}
                  whileHover={{ scale: 1.05 }}
                  whileFocus={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {link.name}
                </motion.a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};
