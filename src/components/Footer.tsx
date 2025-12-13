import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

export const Footer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const linkVariants = {
    hover: { x: 5, color: '#00E0FF' }
  };

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    
    // Safe anchor validation: only allow safe anchor IDs (not Supabase tokens)
    const SAFE_ANCHOR_REGEX = /^#[A-Za-z][A-Za-z0-9_-]*$/;
    if (!SAFE_ANCHOR_REGEX.test(href)) {
      // Ignore unsafe hashes (e.g., #access_token=..., #code=...)
      return;
    }
    
    if (location.pathname !== '/') {
        navigate(`/${href}`);
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
    }
  };

  return (
    <footer className="bg-black border-t border-white/10 pt-16 pb-8">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          <div className="col-span-1 md:col-span-1">
            <div className="mb-6">
              <img src="/main-logo.png" alt="AIDevelo.ai Logo - Intelligente Sprach-KI für Schweizer KMUs" className="h-8 w-auto object-contain" />
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              Die intelligente Sprach-KI für Schweizer KMUs. 
              Verpassen Sie nie wieder einen Anruf.
            </p>
            <div className="mt-6 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                <span className="text-xs font-mono text-gray-400">Made in Zürich</span>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Produkt</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <motion.a whileHover="hover" variants={linkVariants} href="#features" onClick={(e: React.MouseEvent<HTMLAnchorElement>) => scrollToSection(e, '#features')} className="inline-block transition-colors cursor-pointer">Funktionen</motion.a>
              </li>
              <li>
                <motion.a whileHover="hover" variants={linkVariants} href="#industries" onClick={(e: React.MouseEvent<HTMLAnchorElement>) => scrollToSection(e, '#industries')} className="inline-block transition-colors cursor-pointer">Branchen</motion.a>
              </li>
              <li>
                <motion.a whileHover="hover" variants={linkVariants} href="#demo" onClick={(e: React.MouseEvent<HTMLAnchorElement>) => scrollToSection(e, '#demo')} className="inline-block transition-colors cursor-pointer">Live Demo</motion.a>
              </li>
              <li>
                <motion.a whileHover="hover" variants={linkVariants} href="#how-it-works" onClick={(e: React.MouseEvent<HTMLAnchorElement>) => scrollToSection(e, '#how-it-works')} className="inline-block transition-colors cursor-pointer">Ablauf</motion.a>
              </li>
              <li>
                <motion.a whileHover="hover" variants={linkVariants} href="#pricing" onClick={(e: React.MouseEvent<HTMLAnchorElement>) => scrollToSection(e, '#pricing')} className="inline-block transition-colors cursor-pointer">Preise</motion.a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Rechtliches</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <motion.a 
                  whileHover="hover" 
                  variants={linkVariants} 
                  href="/impressum" 
                  onClick={(e) => { e.preventDefault(); navigate('/impressum'); }}
                  className="inline-block transition-colors cursor-pointer"
                >
                  Impressum
                </motion.a>
              </li>
              <li>
                <motion.a 
                  whileHover="hover" 
                  variants={linkVariants} 
                  href="/datenschutz" 
                  onClick={(e) => { e.preventDefault(); navigate('/datenschutz'); }}
                  className="inline-block transition-colors cursor-pointer"
                >
                  Datenschutz
                </motion.a>
              </li>
              <li>
                <motion.a 
                  whileHover="hover" 
                  variants={linkVariants} 
                  href="/agb" 
                  onClick={(e) => { e.preventDefault(); navigate('/agb'); }}
                  className="inline-block transition-colors cursor-pointer"
                >
                  AGB
                </motion.a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Kontakt</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>Zürich, Schweiz</li>
              <li><a href="mailto:hello@aidevelo.ai" className="hover:text-white transition-colors">hello@aidevelo.ai</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-xs">© {new Date().getFullYear()} AIDevelo.ai Switzerland. Alle Rechte vorbehalten.</p>
          <div className="flex gap-4">
            {/* Social Icons Placeholders */}
            <motion.div 
                whileHover={{ scale: 1.1 }}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
            />
            <motion.div 
                whileHover={{ scale: 1.1 }}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
            />
          </div>
        </div>
      </div>
    </footer>
  );
};