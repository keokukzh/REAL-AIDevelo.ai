import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Home, DollarSign, Zap, Code, Mail } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface MobileNavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface MobileNavigationProps {
  items: MobileNavItem[];
  className?: string;
}

/**
 * Mobile Navigation Component
 * Sticky bottom navigation bar for mobile devices
 */
export const MobileNavigation: React.FC<MobileNavigationProps> = ({ 
  items, 
  className = '' 
}) => {
  const [activeItem, setActiveItem] = useState<string>('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      
      for (let i = items.length - 1; i >= 0; i--) {
        const section = document.getElementById(items[i].id);
        if (section && section.offsetTop <= scrollPosition) {
          setActiveItem(items[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [items]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
      setIsMenuOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <nav
        className={`md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 ${className}`}
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-around px-2 py-2 safe-bottom">
          {items.slice(0, 4).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all min-h-[44px] min-w-[44px] focus-visible:ring-2 focus-visible:ring-swiss-red focus-visible:ring-offset-2 ${
                  activeItem === item.id
                    ? 'text-swiss-red'
                    : 'text-gray-400 hover:text-white'
                }`}
                aria-label={`Navigate to ${item.label}`}
                aria-current={activeItem === item.id ? 'page' : undefined}
              >
                <Icon size={20} aria-hidden="true" />
                <span className="text-[10px] font-mono uppercase tracking-wider">
                  {item.label}
                </span>
              </button>
            );
          })}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all min-h-[44px] min-w-[44px] text-gray-400 hover:text-white focus-visible:ring-2 focus-visible:ring-swiss-red focus-visible:ring-offset-2"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? (
              <X size={20} aria-hidden="true" />
            ) : (
              <Menu size={20} aria-hidden="true" />
            )}
            <span className="text-[10px] font-mono uppercase tracking-wider">More</span>
          </button>
        </div>
      </nav>

      {/* Expanded Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setIsMenuOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ 
                duration: prefersReducedMotion ? 0 : 0.3,
                ease: [0.22, 1, 0.36, 1]
              }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-white/10 rounded-t-3xl md:hidden safe-bottom"
            >
              <div className="p-6 space-y-2">
                <h3 className="text-sm font-mono text-gray-400 uppercase tracking-widest mb-4">
                  All Sections
                </h3>
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all min-h-[44px] focus-visible:ring-2 focus-visible:ring-swiss-red focus-visible:ring-offset-2 ${
                        activeItem === item.id
                          ? 'bg-swiss-red/20 text-swiss-red border-l-2 border-swiss-red'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                      aria-label={`Navigate to ${item.label}`}
                      aria-current={activeItem === item.id ? 'page' : undefined}
                    >
                      <Icon size={18} aria-hidden="true" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
