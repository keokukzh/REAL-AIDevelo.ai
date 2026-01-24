import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface Section {
  id: string;
  title: string;
  level: number;
}

interface TableOfContentsProps {
  sections: Section[];
  className?: string;
}

/**
 * Table of Contents Component
 * Provides sticky navigation for page sections with scroll spy
 */
export const TableOfContents: React.FC<TableOfContentsProps> = ({ 
  sections, 
  className = '' 
}) => {
  const [activeSection, setActiveSection] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      
      // Find the current section
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i].id);
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(sections[i].id);
          break;
        }
      }

      // Show TOC after scrolling past hero
      setIsVisible(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
    }
  };

  if (sections.length === 0) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
          className={`hidden lg:block fixed left-8 top-1/2 -translate-y-1/2 z-50 ${className}`}
          aria-label="Table of contents"
        >
          <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl">
            <h3 className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-4 px-2">
              Navigation
            </h3>
            <ul className="space-y-2" role="list">
              {sections.map((section) => (
                <li key={section.id}>
                  <button
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all focus-visible:ring-2 focus-visible:ring-swiss-red focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                      activeSection === section.id
                        ? 'bg-swiss-red/20 text-swiss-red font-semibold border-l-2 border-swiss-red'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                    style={{ paddingLeft: `${section.level * 12 + 12}px` }}
                    aria-current={activeSection === section.id ? 'location' : undefined}
                  >
                    {section.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
};
