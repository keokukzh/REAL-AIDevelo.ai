import React, { useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { Menu, X, LogIn, ArrowLeft } from 'lucide-react';
import { useNavigation, useNavigationWithLocation } from '../hooks/useNavigation';
import { useNavbarState } from '../hooks/useNavbarState';
import { ROUTES, NAVIGATION_ITEMS, SECTION_LINKS } from '../config/navigation';
import { NavLink } from './navigation/NavLink';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useAuthContext } from '../contexts/AuthContext';

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
  const { isAuthenticated } = useAuthContext();

  const prefersReducedMotion = useReducedMotion();
  const headerRef = useRef<HTMLDivElement>(null);

  // Scroll tracking for animations
  const { scrollY } = useScroll();
  const scrollYSpring = useSpring(scrollY, { stiffness: 100, damping: 30 });

  // Logo movement animations (parallax effect)
  const leftLogoY = useTransform(scrollYSpring, [0, 500], [0, -10], { clamp: true });
  const centerLogoY = useTransform(scrollYSpring, [0, 500], [0, -6], { clamp: true });
  const rightLogoY = useTransform(scrollYSpring, [0, 500], [0, -10], { clamp: true });

  // Subtle rotation on scroll
  const leftLogoRotate = useTransform(scrollYSpring, [0, 1000], [0, 3], { clamp: true });
  const rightLogoRotate = useTransform(scrollYSpring, [0, 1000], [0, -3], { clamp: true });

  // Wave glow effect based on scroll
  const waveOffset = useTransform(scrollYSpring, [0, 1000], [0, 360]);
  const glowIntensity = useTransform(scrollYSpring, [0, 300], [0.2, 0.7], { clamp: true });

  // Logo glow effects (scroll-based)
  const leftLogoGlow = useTransform(
    scrollYSpring,
    [0, 300],
    ['drop-shadow(0_0_0px_rgba(218,41,28,0))', 'drop-shadow(0_0_15px_rgba(218,41,28,0.8))']
  );
  const centerLogoGlow = useTransform(
    scrollYSpring,
    [0, 300],
    ['drop-shadow(0_0_0px_rgba(0,224,255,0))', 'drop-shadow(0_0_15px_rgba(0,224,255,0.8))']
  );
  const rightLogoGlow = useTransform(
    scrollYSpring,
    [0, 300],
    ['drop-shadow(0_0_0px_rgba(0,224,255,0))', 'drop-shadow(0_0_15px_rgba(0,224,255,0.8))']
  );

  // Wave gradient animation
  const waveGradient = useTransform(
    waveOffset,
    (offset) => `linear-gradient(${offset}deg, 
      rgba(218, 41, 28, 0) 0%, 
      rgba(218, 41, 28, 0.15) 25%, 
      rgba(0, 224, 255, 0.15) 50%, 
      rgba(218, 41, 28, 0.15) 75%, 
      rgba(218, 41, 28, 0) 100%)`
  );

  // Shimmer wave effect
  const shimmerGradient = useTransform(
    waveOffset,
    (offset) => `linear-gradient(${offset * 2}deg, 
      transparent 0%, 
      rgba(255, 255, 255, 0.08) 25%, 
      transparent 50%, 
      rgba(255, 255, 255, 0.08) 75%, 
      transparent 100%)`
  );

  const shimmerOpacity = useTransform(scrollYSpring, [0, 400], [0, 0.4], { clamp: true });

  // Removed handleStart - Onboarding button removed from navbar

  const handleSectionClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    nav.goToSection(href, location.pathname);
    setMobileMenuOpen(false);
  };

  // Determine active routes for highlighting
  const isActiveRoute = (path: string) => {
    if (path === ROUTES.HOME) {
      return location.pathname === ROUTES.HOME;
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <motion.header
      variants={{
        visible: { y: 0 },
        hidden: { y: "-100%" },
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? 'py-3' : 'py-4'}`}
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div 
          ref={headerRef}
          className={`relative flex items-center justify-between rounded-full px-4 sm:px-6 py-2.5 sm:py-3 transition-all duration-300 overflow-hidden ${scrolled ? 'bg-black/60 backdrop-blur-lg border border-white/10 shadow-lg' : 'bg-transparent'}`}
        >
            {/* Wave Glow Effect - Animated Background */}
            {!prefersReducedMotion && (
              <motion.div
                className="absolute inset-0 pointer-events-none rounded-full"
                style={{
                  background: waveGradient,
                  opacity: glowIntensity,
                }}
              />
            )}
            
            {/* Shimmer Wave Effect */}
            {!prefersReducedMotion && (
              <motion.div
                className="absolute inset-0 pointer-events-none rounded-full"
                style={{
                  background: shimmerGradient,
                  opacity: shimmerOpacity,
                  backgroundSize: '200% 200%',
                }}
                animate={{
                  backgroundPosition: ['0% 0%', '100% 100%'],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            )}

            {/* Grid Layout for Perfect Centering */}
            <div className="flex w-full items-center justify-between relative z-10">
              <div className="hidden md:flex flex-1 items-center justify-start">
                {location.pathname !== ROUTES.HOME && (
                  <motion.a
                    href={ROUTES.HOME}
                    onClick={(e) => {
                      e.preventDefault();
                      nav.goToHome();
                    }}
                    className="flex items-center gap-2 text-white/80 hover:text-white transition-all text-sm font-medium group bg-white/0 hover:bg-white/5 px-3 py-1.5 rounded-full"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ x: -1 }}
                  >
                    <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                    Alle Services
                  </motion.a>
                )}
              </div>

              {/* Center: Main Logo - Perfectly Centered */}
              <div className="flex flex-1 items-center justify-center">
                <motion.a 
                    href={ROUTES.HOME} 
                    onClick={(e) => { 
                      e.preventDefault(); 
                      if (location.pathname === ROUTES.HOME) {
                        nav.scrollToTop();
                      } else {
                        nav.goToHome();
                      }
                    }}
                    className="flex items-center group relative"
                    style={{
                      y: prefersReducedMotion ? 0 : centerLogoY,
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="AIDevelo.ai Logo"
                >
                    <motion.div
                      className="relative"
                      style={prefersReducedMotion ? {} : {
                        filter: centerLogoGlow,
                      }}
                    >
                      <img 
                        src="/main-logo.png" 
                        alt="AIDevelo.ai" 
                        className="h-8 md:h-10 w-auto object-contain transition-all duration-300 group-hover:drop-shadow-[0_0_12px_rgba(0,224,255,0.6)]"
                        style={{ maxHeight: '40px' }}
                      />
                    </motion.div>
                </motion.a>
              </div>

              {/* Right Side: Quick Login / Dashboard */}
              <div className="flex flex-1 items-center justify-end gap-3">
                <motion.button
                  onClick={() => nav.goTo(isAuthenticated ? ROUTES.DASHBOARD : ROUTES.LOGIN)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-semibold transition-all duration-200 flex items-center gap-2 backdrop-blur-sm"
                  whileHover={{ scale: 1.05, borderColor: 'rgba(255,255,255,0.2)' }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={isAuthenticated ? "Zum Dashboard navigieren" : "Zum Login navigieren"}
                >
                  <LogIn size={16} />
                  <span className="hidden sm:inline">{isAuthenticated ? 'Dashboard' : 'Login'}</span>
                </motion.button>
              </div>
            </div>

            {/* Mobile: Logo + Toggle */}
            <div className="md:hidden flex items-center justify-between flex-1">
              {/* Mobile Main Logo */}
              <motion.a 
                href={ROUTES.HOME} 
                onClick={(e) => { 
                  e.preventDefault(); 
                  if (location.pathname === ROUTES.HOME) {
                    nav.scrollToTop();
                  } else {
                    nav.goToHome();
                  }
                }}
                className="flex items-center flex-shrink-0"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="AIDevelo.ai Logo"
              >
                <img 
                  src="/main-logo.png" 
                  alt="AIDevelo.ai" 
                  className="h-7 w-auto object-contain transition-all duration-300"
                  style={{ maxHeight: '28px' }}
                />
              </motion.a>
              
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
                  initial={{ opacity: 0, x: '100%' }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: '100%' }}
                  transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
                  className="absolute top-0 right-0 w-full h-screen bg-black/95 backdrop-blur-lg flex flex-col items-center justify-center space-y-8 md:hidden rounded-none z-40 fixed inset-0"
                  aria-label="Hauptnavigation"
                >
                    <motion.a 
                        href={ROUTES.VOICE_AGENTS}
                        onClick={(e) => { 
                          e.preventDefault(); 
                          nav.goTo(ROUTES.VOICE_AGENTS);
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black rounded px-2 py-1"
                        aria-label="Zur Voice Agents Hauptseite navigieren"
                        whileHover={{ scale: 1.05 }}
                        whileFocus={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <img
                          src="/voiceagent-logo-white.png"
                          alt="Voice Agents"
                          className="h-12 w-auto object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                    </motion.a>
                    <motion.a
                        href={ROUTES.WEBDESIGN}
                        onClick={(e) => {
                          e.preventDefault();
                          nav.goTo(ROUTES.WEBDESIGN);
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black rounded px-2 py-1"
                        aria-label="Zur Webdesign Seite navigieren"
                        whileHover={{ scale: 1.05 }}
                        whileFocus={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <img
                          src="/webdesign-logo-white.png"
                          alt="Webdesign"
                          className="h-12 w-auto object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                    </motion.a>
                    {/* Quick Login/Dashboard Button in Mobile Menu - Always visible */}
                    <motion.button
                      onClick={() => {
                        nav.goTo(isAuthenticated ? ROUTES.DASHBOARD : ROUTES.LOGIN);
                        setMobileMenuOpen(false);
                      }}
                      className="px-6 py-3 rounded-xl bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary font-semibold transition-all duration-200 flex items-center gap-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label={isAuthenticated ? "Zum Dashboard navigieren" : "Zum Login navigieren"}
                    >
                      <LogIn size={18} />
                      <span>{isAuthenticated ? 'Dashboard' : 'Login'}</span>
                    </motion.button>
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
                </motion.nav>
              )}
            </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
};