import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../config/navigation';
import { UserPlus, ArrowRight, X } from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';

export const StickyRegistrationWidget: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Don't show if already authenticated
  if (isAuthenticated) {
    return null;
  }

  const handleClick = () => {
    navigate(ROUTES.LOGIN);
  };

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-50 md:bottom-8 md:right-8"
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1 }}
      onMouseEnter={() => {
        setIsHovered(true);
        setIsExpanded(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        // Delay collapse to allow clicking
        setTimeout(() => {
          if (!isHovered) {
            setIsExpanded(false);
          }
        }, 200);
      }}
    >
      <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 20 }}
            transition={{ duration: 0.3 }}
            className="bg-gradient-to-br from-primary/95 via-accent/95 to-primary/95 backdrop-blur-lg border-2 border-white/20 rounded-2xl shadow-2xl overflow-hidden"
            style={{ minWidth: '280px', maxWidth: '380px' }}
          >
            {/* Close button */}
            <button
              onClick={() => setIsExpanded(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
              aria-label="Widget schließen"
            >
              <X size={16} className="text-white" />
            </button>

            {/* Content */}
            <div className="p-6 pt-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <UserPlus size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg mb-2 font-display">
                    Jetzt bereits free registrieren
                  </h3>
                  <p className="text-white/90 text-sm leading-relaxed">
                    und Dashboard Preview erhalten
                  </p>
                </div>
              </div>

              <motion.button
                onClick={handleClick}
                className="w-full bg-white text-primary hover:bg-white/90 font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>Jetzt registrieren</span>
                <ArrowRight size={18} />
              </motion.button>

              <p className="text-white/70 text-xs text-center mt-3">
                Kostenlos • Keine Kreditkarte erforderlich
              </p>
            </div>

            {/* Animated border glow */}
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                background: 'linear-gradient(45deg, rgba(0,224,255,0.3), rgba(218,41,28,0.3), rgba(0,224,255,0.3))',
                backgroundSize: '200% 200%',
              }}
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          </motion.div>
        ) : (
          <motion.button
            key="collapsed"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsExpanded(true)}
            className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-primary via-accent to-primary shadow-2xl border-2 border-white/20 flex items-center justify-center group hover:scale-110 transition-transform duration-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Registrierung öffnen"
          >
            <motion.div
              animate={isHovered ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 0.5 }}
            >
              <UserPlus size={24} className="text-white md:w-7 md:h-7" />
            </motion.div>

            {/* Pulse effect */}
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/50"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

