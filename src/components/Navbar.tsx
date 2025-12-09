import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { Mic, Menu, X } from 'lucide-react';
import { Button } from './ui/Button';

interface NavbarProps {
  onStartOnboarding?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onStartOnboarding }) => {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const navigate = useNavigate();
  const location = useLocation();

  useMotionValueEvent(scrollY, "change", (latest) => {
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

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    
    // If we are not on the landing page, navigate there with the hash
    if (location.pathname !== '/') {
        navigate(`/${href}`); // e.g., /#features
        setMobileMenuOpen(false);
        return;
    }

    const section = document.querySelector(href);
    if (section) {
      const headerOffset = 80;
      const elementPosition = section.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
      setMobileMenuOpen(false);
    } else if (href === '#') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navLinks = [
    { name: 'Funktionen', href: '#features' },
    { name: 'Branchen', href: '#industries' },
    { name: 'Demo', href: '#demo' },
    { name: 'Ablauf', href: '#how-it-works' },
    { name: 'Preise', href: '#pricing' },
    { name: 'FAQ', href: '#faq' },
  ];

  return (
    <motion.header
      variants={{
        visible: { y: 0 },
        hidden: { y: "-100%" },
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? 'py-4' : 'py-6'}`}
    >
      <div className="container mx-auto px-6">
        <div className={`relative flex items-center justify-between rounded-full px-6 py-3 transition-all duration-300 ${scrolled ? 'bg-black/60 backdrop-blur-lg border border-white/10 shadow-lg' : 'bg-transparent'}`}>
            
            {/* Logo */}
            <motion.a 
                href="/" 
                onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="flex items-center gap-2 text-white font-display font-bold text-xl z-50 tracking-wide group"
                whileHover={{ scale: 1.05 }}
            >
                <img src="/main-logo.png" alt="AIDevelo.ai" className="h-8 w-auto object-contain" />
            </motion.a>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8" aria-label="Hauptnavigation">
                {navLinks.map((link) => (
                    <motion.a 
                        key={link.name} 
                        href={link.href}
                        onClick={(e: React.MouseEvent<HTMLAnchorElement>) => scrollToSection(e, link.href)}
                        className="text-sm font-medium text-gray-300 hover:text-white transition-colors cursor-pointer"
                        whileHover={{ scale: 1.05, color: '#fff' }}
                        aria-label={`Zu ${link.name} navigieren`}
                    >
                        {link.name}
                    </motion.a>
                ))}
            </nav>

            {/* CTA */}
            <div className="hidden md:block">
                <Button 
                  onClick={onStartOnboarding} 
                  variant="secondary" 
                  className="!px-6 !py-2 text-sm"
                  aria-label="Onboarding starten"
                >
                    Jetzt testen
                </Button>
            </div>

            {/* Mobile Toggle */}
            <button 
                className="md:hidden text-white z-50"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? "Menü schließen" : "Menü öffnen"}
                aria-expanded={mobileMenuOpen}
            >
                {mobileMenuOpen ? <X /> : <Menu />}
            </button>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <nav 
                  className="absolute top-0 right-0 w-full h-screen bg-black flex flex-col items-center justify-center space-y-8 md:hidden rounded-none z-40 fixed inset-0"
                  aria-label="Hauptnavigation"
                >
                    {navLinks.map((link) => (
                        <a 
                            key={link.name} 
                            href={link.href}
                            onClick={(e) => scrollToSection(e, link.href)}
                            className="text-2xl font-bold text-white hover:text-accent cursor-pointer"
                            aria-label={`Zu ${link.name} navigieren`}
                        >
                            {link.name}
                        </a>
                    ))}
                    <Button 
                      onClick={() => { onStartOnboarding?.(); setMobileMenuOpen(false); }} 
                      variant="primary"
                      aria-label="Onboarding starten"
                    >
                      Jetzt testen
                    </Button>
                </nav>
            )}
        </div>
      </div>
    </motion.header>
  );
};