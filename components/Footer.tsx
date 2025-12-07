import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mic } from 'lucide-react';

export const Footer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const linkVariants = {
    hover: { x: 5, color: '#00E0FF' }
  };

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    
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
              <img src="/main-logo.png" alt="AIDevelo.ai" className="h-8 w-auto object-contain" />
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              Die intelligente Sprach-KI für Schweizer KMUs. 
              Verpassen Sie nie wieder einen Anruf.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Produkt</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <motion.a whileHover="hover" variants={linkVariants} href="#features" onClick={(e: React.MouseEvent<HTMLAnchorElement>) => scrollToSection(e, '#features')} className="inline-block transition-colors cursor-pointer">Funktionen</motion.a>
              </li>
              <li>
                <motion.a whileHover="hover" variants={linkVariants} href="#demo" onClick={(e: React.MouseEvent<HTMLAnchorElement>) => scrollToSection(e, '#demo')} className="inline-block transition-colors cursor-pointer">Live Demo</motion.a>
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
                <motion.a whileHover="hover" variants={linkVariants} href="#" className="inline-block transition-colors cursor-pointer">Impressum</motion.a>
              </li>
              <li>
                <motion.a whileHover="hover" variants={linkVariants} href="#" className="inline-block transition-colors cursor-pointer">Datenschutz</motion.a>
              </li>
              <li>
                <motion.a whileHover="hover" variants={linkVariants} href="#" className="inline-block transition-colors cursor-pointer">AGB</motion.a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Kontakt</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>Zürich, Schweiz</li>
              <li><a href="mailto:hello@aidevelo.ai" className="hover:text-white transition-colors">hello@aidevelo.ai</a></li>
              <li>+41 44 123 45 67</li>
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