import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { Menu, X, LogIn, ChevronDown } from 'lucide-react';
import { Button } from './ui/Button';

interface NavbarProps {
  onStartOnboarding?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onStartOnboarding }) => {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [voiceAgentsDropdownOpen, setVoiceAgentsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
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

  const handleStart = () => {
    if (onStartOnboarding) {
      onStartOnboarding();
    } else {
      navigate('/onboarding');
    }
    setMobileMenuOpen(false);
  };

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    
    // Safe anchor validation: only allow safe anchor IDs (not Supabase tokens)
    const SAFE_ANCHOR_REGEX = /^#[A-Za-z][A-Za-z0-9_-]*$/;
    if (href !== '#' && !SAFE_ANCHOR_REGEX.test(href)) {
      // Ignore unsafe hashes (e.g., #access_token=..., #code=...)
      setMobileMenuOpen(false);
      return;
    }
    
    // If we are not on the landing page, navigate there with the hash
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTarget: href } });
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
            {/* Grid Layout for Perfect Centering */}
            <div className="hidden md:grid grid-cols-3 w-full items-center">
              {/* Left Side: Webdesign Link */}
              <div className="flex items-center justify-start">
                <motion.a
                  href="/webdesign"
                  onClick={(e) => { e.preventDefault(); navigate('/webdesign'); }}
                  className="text-sm font-medium text-gray-300 hover:text-white transition-colors cursor-pointer"
                  whileHover={{ scale: 1.05, color: '#fff' }}
                  aria-label="Zu Webdesign navigieren"
                >
                  Webdesign
                </motion.a>
              </div>

              {/* Center: Logo - Perfectly Centered */}
              <div className="flex items-center justify-center">
                <motion.a 
                    href="/" 
                    onClick={(e) => { e.preventDefault(); navigate('/'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="flex items-center gap-2 text-white font-display font-bold text-xl tracking-wide group"
                    whileHover={{ scale: 1.05 }}
                >
                    <img 
                      src="/main-logo.png" 
                      alt="AIDevelo.ai" 
                      className="h-8 w-auto object-contain"
                    />
                </motion.a>
              </div>

              {/* Right Side: Voice Agents Dropdown + Buttons */}
              <div className="flex items-center gap-4 justify-end">
              {/* Voice Agents Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <motion.button
                  onClick={() => setVoiceAgentsDropdownOpen(!voiceAgentsDropdownOpen)}
                  onMouseEnter={() => setVoiceAgentsDropdownOpen(true)}
                  className="flex items-center gap-1 text-sm font-medium text-gray-300 hover:text-white transition-colors cursor-pointer px-3 py-2 rounded-lg hover:bg-white/5"
                  whileHover={{ scale: 1.05 }}
                  aria-label="Voice Agents Menü"
                  aria-haspopup="true"
                >
                  Voice Agents
                  <ChevronDown 
                    size={16} 
                    className={`transition-transform duration-200 ${voiceAgentsDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </motion.button>

                <AnimatePresence>
                  {voiceAgentsDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      onMouseLeave={() => setVoiceAgentsDropdownOpen(false)}
                      className="absolute top-full right-0 mt-2 w-48 bg-black/95 backdrop-blur-lg border border-white/10 rounded-xl shadow-2xl py-2 z-50"
                    >
                      {navLinks.map((link) => (
                        <motion.a
                          key={link.name}
                          href={link.href}
                          onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                            scrollToSection(e, link.href);
                            setVoiceAgentsDropdownOpen(false);
                          }}
                          className="block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                          whileHover={{ x: 4 }}
                          aria-label={`Zu ${link.name} navigieren`}
                        >
                          {link.name}
                        </motion.a>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
                <Button
                  onClick={handleStart}
                  variant="primary"
                  className="!px-4 !py-2 text-sm flex items-center gap-2"
                  aria-label="Onboarding starten"
                >
                  Onboarding starten
                </Button>
                <Button 
                  onClick={() => navigate('/dashboard')} 
                  variant="outline" 
                  className="!px-4 !py-2 text-sm flex items-center gap-2"
                  aria-label="Login to Aidevelo Studio"
                >
                    <img 
                      src="/logo-studio-white.png" 
                      alt="Aidevelo Studio" 
                      className="h-5 w-auto object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <LogIn size={16} />
                    <span>Login</span>
                </Button>
              </div>
            </div>

            {/* Mobile: Webdesign + Login Button + Toggle */}
            <div className="md:hidden flex items-center gap-3">
              <motion.a
                href="/webdesign"
                onClick={(e) => { e.preventDefault(); navigate('/webdesign'); setMobileMenuOpen(false); }}
                className="text-sm font-medium text-white"
                aria-label="Zu Webdesign navigieren"
              >
                Webdesign
              </motion.a>
                <Button
                  onClick={handleStart}
                  variant="primary"
                  className="!px-3 !py-2 text-xs flex items-center gap-1"
                  aria-label="Onboarding starten"
                >
                  Onboarding
                </Button>
                <Button 
                  onClick={() => navigate('/dashboard')} 
                  variant="outline" 
                  className="!px-3 !py-2 text-xs flex items-center gap-1"
                  aria-label="Login to Studio"
                >
                    <img 
                      src="/logo-studio-white.png" 
                      alt="Studio" 
                      className="h-4 w-auto object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <LogIn size={14} />
                    <span>Login</span>
                </Button>
                <button 
                    className="text-white z-50"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label={mobileMenuOpen ? "Menü schließen" : "Menü öffnen"}
                    {...(mobileMenuOpen && { 'aria-expanded': true })}
                >
                    {mobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <nav 
                  className="absolute top-0 right-0 w-full h-screen bg-black flex flex-col items-center justify-center space-y-8 md:hidden rounded-none z-40 fixed inset-0"
                  aria-label="Hauptnavigation"
                >
                    <div className="text-xl font-semibold text-gray-400 mb-4">Voice Agents</div>
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
                      onClick={() => navigate('/dashboard')} 
                      variant="outline"
                      className="w-full flex items-center justify-center gap-2"
                      aria-label="Login to Studio"
                    >
                        <img 
                          src="/logo-studio-white.png" 
                          alt="Studio" 
                          className="h-5 w-auto object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                        <LogIn size={18} />
                        <span>Login</span>
                    </Button>
                    <Button
                      onClick={handleStart}
                      variant="primary"
                      className="w-full flex items-center justify-center gap-2"
                      aria-label="Onboarding starten"
                    >
                      Onboarding starten
                    </Button>
                </nav>
            )}
        </div>
      </div>
    </motion.header>
  );
};