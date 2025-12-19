import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LogIn, ChevronDown } from 'lucide-react';
import { Button } from './ui/Button';
import { useNavigation, useNavigationWithLocation } from '../hooks/useNavigation';
import { useNavbarState } from '../hooks/useNavbarState';
import { ROUTES, NAVIGATION_ITEMS, SECTION_LINKS } from '../config/navigation';
import { NavLink } from './navigation/NavLink';

interface NavbarProps {
  onStartOnboarding?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onStartOnboarding }) => {
  const { nav, location } = useNavigationWithLocation();
  const {
    hidden,
    scrolled,
    mobileMenuOpen,
    setMobileMenuOpen,
    voiceAgentsDropdownOpen,
    setVoiceAgentsDropdownOpen,
    dropdownRef,
  } = useNavbarState();

  const handleStart = () => {
    if (onStartOnboarding) {
      onStartOnboarding();
    } else {
      nav.goTo(ROUTES.ONBOARDING);
    }
    setMobileMenuOpen(false);
  };

  const handleSectionClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    nav.goToSection(href, location.pathname);
    setMobileMenuOpen(false);
    setVoiceAgentsDropdownOpen(false);
  };

  const isWebdesignPage = location.pathname === ROUTES.WEBDESIGN;
  
  // Determine active routes for highlighting
  const isActiveRoute = (path: string) => {
    if (path === ROUTES.HOME) {
      return location.pathname === ROUTES.HOME;
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const isWebdesignActive = isActiveRoute(ROUTES.WEBDESIGN);
  const isVoiceAgentsActive = isActiveRoute(ROUTES.HOME);

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
                <NavLink
                  to={ROUTES.WEBDESIGN}
                  label={NAVIGATION_ITEMS.WEBDESIGN.label}
                  variant="link"
                  ariaLabel={NAVIGATION_ITEMS.WEBDESIGN.ariaLabel}
                  className={isWebdesignActive ? 'text-white font-semibold' : ''}
                />
              </div>

              {/* Center: Logo - Perfectly Centered */}
              <div className="flex items-center justify-center">
                <motion.a 
                    href={isWebdesignPage ? ROUTES.WEBDESIGN : ROUTES.HOME} 
                    onClick={(e) => { 
                      e.preventDefault(); 
                      if (isWebdesignPage) {
                        nav.scrollToTop();
                      } else {
                        nav.goToHome();
                      }
                    }}
                    className="flex items-center gap-2 text-white font-display font-bold text-xl tracking-wide group"
                    whileHover={{ scale: 1.05 }}
                    aria-label={isWebdesignPage ? 'AIDevelo Webdesign Logo' : 'AIDevelo.ai Logo'}
                >
                    <img 
                      src={isWebdesignPage ? '/webdesign-logo-white.png' : '/main-logo.png'} 
                      alt={isWebdesignPage ? 'AIDevelo Webdesign' : 'AIDevelo.ai'} 
                      className="h-8 w-auto object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        // Fallback to main logo if webdesign logo fails to load
                        if (target.src.includes('webdesign-logo')) {
                          target.src = '/main-logo.png';
                          target.alt = 'AIDevelo.ai';
                        }
                      }}
                    />
                </motion.a>
              </div>

              {/* Right Side: Voice Agents Link + Dropdown + Buttons */}
              <div className="flex items-center gap-4 justify-end">
              {/* Voice Agents Link (always visible) */}
              <NavLink
                to={ROUTES.HOME}
                label={NAVIGATION_ITEMS.VOICE_AGENTS.label}
                variant="link"
                scrollToTop={true}
                ariaLabel={NAVIGATION_ITEMS.VOICE_AGENTS.ariaLabel}
                className={isVoiceAgentsActive ? 'text-white font-semibold' : ''}
              />
              
              {/* Voice Agents Dropdown (for section links) */}
              <div className="relative" ref={dropdownRef}>
                <motion.button
                  onClick={() => setVoiceAgentsDropdownOpen(!voiceAgentsDropdownOpen)}
                  onMouseEnter={() => setVoiceAgentsDropdownOpen(true)}
                  className="flex items-center gap-1 text-sm font-medium text-white hover:text-white transition-all duration-200 cursor-pointer px-3 py-2 rounded-lg hover:bg-white/10 bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black/60"
                  whileHover={{ scale: 1.05 }}
                  whileFocus={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Voice Agents Sektionen Menü"
                  aria-haspopup="true"
                  aria-expanded={voiceAgentsDropdownOpen}
                >
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
                      <motion.a
                        href={ROUTES.HOME}
                        onClick={(e) => { 
                          e.preventDefault(); 
                          nav.goToHome();
                          setVoiceAgentsDropdownOpen(false);
                        }}
                        className="block px-4 py-2.5 text-sm text-white font-semibold hover:bg-white/10 transition-colors cursor-pointer border-b border-white/10"
                        whileHover={{ x: 4 }}
                        aria-label="Zur Voice Agents Hauptseite navigieren"
                      >
                        Hauptseite
                      </motion.a>
                      {SECTION_LINKS.map((link) => (
                        <motion.a
                          key={link.name}
                          href={link.href}
                          onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                            handleSectionClick(e, link.href);
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
                  className="!px-4 !py-2 text-sm flex items-center gap-2 bg-white text-black hover:bg-gray-100 font-semibold"
                  aria-label="Onboarding starten"
                >
                  Onboarding starten
                </Button>
                <Button 
                  onClick={() => nav.goToDashboard()} 
                  variant="outline" 
                  className="!px-4 !py-2 text-sm flex items-center gap-2 text-white border-white/40 hover:border-white/70"
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

            {/* Mobile: Logo + Webdesign + Login Button + Toggle */}
            <div className="md:hidden flex items-center gap-3 flex-1">
              {/* Mobile Logo */}
              <motion.a 
                href={isWebdesignPage ? ROUTES.WEBDESIGN : ROUTES.HOME} 
                onClick={(e) => { 
                  e.preventDefault(); 
                  if (isWebdesignPage) {
                    nav.scrollToTop();
                  } else {
                    nav.goToHome();
                  }
                }}
                className="flex items-center flex-shrink-0"
                whileHover={{ scale: 1.05 }}
                aria-label={isWebdesignPage ? 'AIDevelo Webdesign Logo' : 'AIDevelo.ai Logo'}
              >
                <img 
                  src={isWebdesignPage ? '/webdesign-logo-white.png' : '/main-logo.png'} 
                  alt={isWebdesignPage ? 'AIDevelo Webdesign' : 'AIDevelo.ai'} 
                  className="h-6 w-auto object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    // Fallback to main logo if webdesign logo fails to load
                    if (target.src.includes('webdesign-logo')) {
                      target.src = '/main-logo.png';
                      target.alt = 'AIDevelo.ai';
                    }
                  }}
                />
              </motion.a>
              
              <NavLink
                to={ROUTES.WEBDESIGN}
                label={NAVIGATION_ITEMS.WEBDESIGN.label}
                variant="link"
                onClick={() => setMobileMenuOpen(false)}
                ariaLabel={NAVIGATION_ITEMS.WEBDESIGN.ariaLabel}
                className="text-sm font-medium text-white"
              />
                <Button
                  onClick={handleStart}
                  variant="primary"
                  className="!px-3 !py-2 text-xs flex items-center gap-1 bg-white text-black hover:bg-gray-100 font-semibold"
                  aria-label="Onboarding starten"
                >
                  Onboarding
                </Button>
                <Button 
                  onClick={() => nav.goToDashboard()} 
                  variant="outline" 
                  className="!px-3 !py-2 text-xs flex items-center gap-1 text-white border-white/40 hover:border-white/70"
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
                <motion.button 
                    className="text-white z-50 p-2 rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black/60 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label={mobileMenuOpen ? "Menü schließen" : "Menü öffnen"}
                    aria-expanded={mobileMenuOpen}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    whileFocus={{ scale: 1.05 }}
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </motion.button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
              {mobileMenuOpen && (
                <motion.nav 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-0 right-0 w-full h-screen bg-black/95 backdrop-blur-lg flex flex-col items-center justify-center space-y-8 md:hidden rounded-none z-40 fixed inset-0"
                  aria-label="Hauptnavigation"
                >
                    <motion.a 
                        href={ROUTES.HOME}
                        onClick={(e) => { 
                          e.preventDefault(); 
                          nav.goToHome();
                          setMobileMenuOpen(false);
                        }}
                        className="text-2xl font-bold text-white hover:text-accent cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black rounded px-2 py-1"
                        aria-label="Zur Voice Agents Hauptseite navigieren"
                        whileHover={{ scale: 1.05, x: 4 }}
                        whileFocus={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Voice Agents
                    </motion.a>
                    <div className="text-xl font-semibold text-gray-400 mb-4">Sektionen</div>
                    {SECTION_LINKS.map((link) => (
                        <motion.a 
                            key={link.name} 
                            href={link.href}
                            onClick={(e) => handleSectionClick(e, link.href)}
                            className="text-2xl font-bold text-white hover:text-accent cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black rounded px-2 py-1 min-h-[44px] flex items-center"
                            aria-label={`Zu ${link.name} navigieren`}
                            whileHover={{ scale: 1.05, x: 4 }}
                            whileFocus={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {link.name}
                        </motion.a>
                    ))}
                    <Button 
                      onClick={() => nav.goToDashboard()} 
                      variant="outline"
                      className="w-full flex items-center justify-center gap-2 text-white border-white/40 hover:border-white/70"
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
                      className="w-full flex items-center justify-center gap-2 bg-white text-black hover:bg-gray-100"
                      aria-label="Onboarding starten"
                    >
                      Onboarding starten
                    </Button>
                </motion.nav>
              )}
            </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
};