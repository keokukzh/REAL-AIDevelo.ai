import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../config/navigation';
import { Globe, Mic, ArrowRight, Sparkles, Brain, Code2 } from 'lucide-react';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface Side {
  id: 'webdesign' | 'voice' | 'personalized-ai';
  title: string;
  description: string;
  icon: React.ElementType;
  features: string[];
  color: string;
  bgImage: string;
  route: string;
  tagline: string;
}

interface PortalSideProps {
  side: Side;
  isHovered: boolean;
  isOtherHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
  parallaxY: any;
  prefersReducedMotion: boolean;
}

const PortalSide: React.FC<PortalSideProps> = ({
  side,
  isHovered,
  isOtherHovered,
  onMouseEnter,
  onMouseLeave,
  onClick,
  parallaxY,
  prefersReducedMotion,
}) => {
  const sideRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 200 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  // Magnetic cursor effect
  React.useEffect(() => {
    if (!sideRef.current || prefersReducedMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!sideRef.current) return;
      const rect = sideRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distanceX = e.clientX - centerX;
      const distanceY = e.clientY - centerY;
      const maxDistance = 10;

      mouseX.set(Math.max(-maxDistance, Math.min(maxDistance, distanceX * 0.1)));
      mouseY.set(Math.max(-maxDistance, Math.min(maxDistance, distanceY * 0.1)));
    };

    const handleMouseLeave = () => {
      mouseX.set(0);
      mouseY.set(0);
    };

    if (isHovered) {
      sideRef.current.addEventListener('mousemove', handleMouseMove);
      sideRef.current.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (sideRef.current) {
        sideRef.current.removeEventListener('mousemove', handleMouseMove);
        sideRef.current.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [isHovered, mouseX, mouseY, prefersReducedMotion]);

  const getColorClass = () => {
    if (side.id === 'webdesign') return 'text-swiss-red';
    if (side.id === 'voice') return 'text-cyan-400';
    return 'text-purple-400';
  };

  const getGradientClass = () => {
    if (side.id === 'webdesign') return 'from-black/80 via-black/40 to-transparent';
    if (side.id === 'voice') return 'from-transparent via-black/40 to-black/80';
    return 'from-black/60 via-black/50 to-black/60';
  };

  const getButtonClass = () => {
    if (side.id === 'webdesign') return 'bg-swiss-red text-white';
    if (side.id === 'voice') return 'bg-cyan-500 text-black';
    return 'bg-gradient-to-r from-purple-600 to-pink-500 text-white';
  };

  return (
    <motion.div
      ref={sideRef}
      className="relative flex-1 h-full cursor-pointer overflow-hidden group border-white/5 border-l first:border-l-0 will-change-transform"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      style={prefersReducedMotion ? {} : { x, y }}
      initial={{ flex: 1 }}
      animate={{
        flex: isHovered ? 1.3 : isOtherHovered ? 0.35 : 1,
        transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
      }}
      tabIndex={0}
      role="button"
      aria-label={`Navigate to ${side.title} page`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
    >
      {/* Background Image with Parallax & Gradients */}
      <motion.div
        className="absolute inset-0 z-0 scale-110 will-change-transform"
        style={prefersReducedMotion ? {} : { y: parallaxY }}
        animate={{
          scale: isHovered ? 1.05 : 1.1,
          filter: isHovered ? 'blur(0px) brightness(0.6)' : 'blur(4px) brightness(0.3)',
        }}
        transition={{ duration: 1.2 }}
      >
        <img src={side.bgImage} alt={side.title} className="w-full h-full object-cover" loading="lazy" />
      </motion.div>

      {/* Dynamic Gradient Overlay */}
      <div
        className={`absolute inset-0 z-10 bg-gradient-to-t via-black/40 to-transparent ${
          isHovered ? 'opacity-90' : 'opacity-60'
        } transition-opacity duration-700`}
      />
      <div className={`absolute inset-0 z-10 bg-gradient-to-r ${getGradientClass()} opacity-60`} />

      {/* Accent Color Glow */}
      <motion.div
        className={`absolute inset-0 z-10 bg-gradient-to-br ${side.color} opacity-0`}
        animate={{ opacity: isHovered ? 0.15 : 0 }}
        transition={{ duration: 0.5 }}
      />

      {/* Content Container */}
      <div
        className={`relative z-20 h-full flex flex-col items-center justify-center p-8 md:p-16 text-center transition-all duration-700 ${
          isHovered ? 'translate-y-0 opacity-100' : 'translate-y-4 md:translate-y-0 opacity-80'
        }`}
      >
        {/* Visual Accent for Voice Agent (Enhanced Waveform) */}
        {side.id === 'voice' && isHovered && !prefersReducedMotion && (
          <>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-20 w-full h-32 flex items-center justify-center gap-1">
              {new Array(12).fill(0).map((_, i) => (
                <motion.div
                  key={`voice-waveform-${side.id}-${i}`}
                  className="w-1 bg-cyan-400 rounded-full"
                  animate={{ height: [20, 80, 20] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                />
              ))}
            </div>
            {/* Pulsating sound waves */}
            {new Array(3).fill(0).map((_, i) => (
              <motion.div
                key={`voice-soundwave-${side.id}-${i}`}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none rounded-full border border-cyan-400/30"
                style={{
                  width: 100 + i * 60,
                  height: 100 + i * 60,
                }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 0, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
              />
            ))}
          </>
        )}

        {/* Visual Accent for Webdesign (Grid + Code Particles) */}
        {side.id === 'webdesign' && isHovered && !prefersReducedMotion && (
          <>
            <div
              className="absolute inset-0 pointer-events-none opacity-10"
              style={{
                background: 'radial-gradient(circle, rgba(218,41,28,0.2) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />
            {/* Floating Code Particles */}
            {new Array(8).fill(0).map((_, i) => (
              <motion.div
                key={`webdesign-codeparticle-${side.id}-${i}`}
                className="absolute pointer-events-none text-swiss-red/40 font-mono text-xs"
                initial={{
                  x: Math.random() * 100 + '%',
                  y: Math.random() * 100 + '%',
                  opacity: 0,
                }}
                animate={{
                  y: [null, '-20px', null],
                  opacity: [0, 0.6, 0],
                  scale: [0.8, 1, 0.8],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: i * 0.4,
                }}
              >
                <Code2 size={16} />
              </motion.div>
            ))}
          </>
        )}

        {/* Visual Accent for Personalized AI (Neural Network + Brain Animation) */}
        {side.id === 'personalized-ai' && isHovered && !prefersReducedMotion && (
          <>
            {/* Neural Network Particles */}
            <div className="absolute inset-0 pointer-events-none opacity-30">
              {new Array(15).fill(0).map((_, i) => {
                const x = Math.random() * 100;
                const y = Math.random() * 100;
                return (
                  <motion.div
                    key={`ai-neuralparticle-${side.id}-${i}-${x}-${y}`}
                    className="absolute w-2 h-2 rounded-full bg-purple-400"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                    }}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.4, 0.8, 0.4],
                    }}
                    transition={{
                      duration: 2 + Math.random(),
                      repeat: Infinity,
                      delay: i * 0.1,
                    }}
                  />
                );
              })}
            </div>
            {/* Data Stream Effect */}
            {new Array(5).fill(0).map((_, i) => (
              <motion.div
                key={`ai-datastream-${side.id}-${i}`}
                className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-pink-400/50 to-transparent pointer-events-none"
                style={{
                  left: `${20 + i * 15}%`,
                }}
                animate={{
                  y: ['-100%', '100%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: 'linear',
                }}
              />
            ))}
            {/* Gradient Orbs */}
            {new Array(3).fill(0).map((_, i) => (
              <motion.div
                key={`ai-gradientorb-${side.id}-${i}`}
                className="absolute rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 blur-xl pointer-events-none"
                style={{
                  width: 100 + i * 50,
                  height: 100 + i * 50,
                  left: `${30 + i * 20}%`,
                  top: `${20 + i * 25}%`,
                }}
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 10 + i * 5,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            ))}
          </>
        )}

        {/* Subtitle / Tagline - Staggered Reveal */}
        <motion.span
          className={`text-xs md:text-sm font-bold tracking-[0.3em] uppercase mb-4 block ${getColorClass()}`}
          initial={{ y: 20, opacity: 0 }}
          animate={{
            y: isHovered ? 0 : 20,
            opacity: isHovered ? 1 : 0,
            letterSpacing: isHovered && side.id === 'webdesign' ? '0.4em' : '0.3em',
          } as any}
          transition={{ duration: 0.5, delay: 0 }}
        >
          {side.tagline}
        </motion.span>

        {/* Icon Container - Enhanced with Brain Animation for AI */}
        <motion.div
          className="mb-8 p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl relative group-hover:border-white/20 shadow-2xl transition-colors will-change-transform"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{
            scale: isHovered ? 1.1 : 1,
            opacity: isHovered ? 1 : 0.8,
            rotate: side.id === 'personalized-ai' && isHovered ? [0, 5, -5, 0] : 0,
          }}
          transition={{
            duration: 0.6,
            delay: 0.1,
            rotate: { duration: 2, repeat: Infinity, repeatType: 'reverse' },
          }}
        >
          <motion.div
            animate={
              side.id === 'voice' && isHovered
                ? {
                    scale: [1, 1.1, 1],
                  }
                : {}
            }
            transition={{ duration: 0.8, repeat: Infinity }}
          >
            <side.icon className={`w-12 h-12 md:w-16 md:h-16 ${getColorClass()}`} />
          </motion.div>
          {isHovered && (
            <motion.div
              layoutId={`glow-${side.id}`}
              className={`absolute inset-0 rounded-3xl blur-2xl opacity-50 z-[-1] bg-gradient-to-br ${side.color}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ duration: 0.5 }}
            />
          )}
        </motion.div>

        {/* Title - Staggered Reveal */}
        <motion.h2
          className="text-4xl md:text-6xl lg:text-7xl font-bold font-display text-white mb-6 tracking-tight will-change-transform"
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: isHovered ? 1 : 0.9,
            y: isHovered ? 0 : 10,
          }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {side.title}
        </motion.h2>

        {/* Description - Staggered Reveal */}
        <motion.p
          className="text-lg md:text-xl text-gray-300 max-w-md mx-auto mb-10 leading-relaxed font-medium"
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: isHovered ? 1 : 0.8,
            y: isHovered ? 0 : 10,
          }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {side.description}
        </motion.p>

        {/* Dynamic Features List - Staggered Reveal */}
        <motion.div
          className="flex flex-wrap justify-center gap-4 mb-12"
          initial={{ opacity: 0, y: 40 }}
          animate={{
            opacity: isHovered ? 1 : 0,
            y: isHovered ? 0 : 40,
          }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {side.features.map((feature, i) => (
            <motion.div
              key={`feature-${side.id}-${i}`}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5 backdrop-blur-sm text-sm font-semibold text-white"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: isHovered ? 1 : 0,
                scale: isHovered ? 1 : 0.8,
              }}
              transition={{
                duration: 0.4,
                delay: 0.5 + i * 0.1,
              }}
            >
              <Sparkles size={14} className={getColorClass()} />
              {feature}
            </motion.div>
          ))}
        </motion.div>

        {/* Main CTA - Staggered Reveal */}
        <motion.div
          className="relative group"
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: isHovered ? 1 : 0.8,
            y: isHovered ? 0 : 10,
          }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <motion.div
            className={`flex items-center gap-4 px-10 py-5 rounded-full text-lg font-bold transition-all duration-300 will-change-transform ${getButtonClass()}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            whileFocus={{ scale: 1.05, outline: '2px solid white', outlineOffset: '4px' }}
          >
            Entdecken
            <ArrowRight size={24} />
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom Decoration Lines */}
      <div className="absolute bottom-0 left-0 w-full h-1 z-30 overflow-hidden">
        <motion.div
          className={`w-full h-full bg-gradient-to-r ${side.color}`}
          initial={{ x: '-100%' }}
          animate={{ x: isHovered ? '0%' : '-100%' }}
          transition={{ duration: 0.8 }}
        />
      </div>
    </motion.div>
  );
};

export const SplitPortal: React.FC = () => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [hoveredSide, setHoveredSide] = useState<'webdesign' | 'voice' | 'personalized-ai' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const sides: Side[] = [
    {
      id: 'webdesign',
      title: 'Webdesign',
      description: 'Hochmoderne Websites & Digitale Erlebnisse',
      icon: Globe,
      features: ['Modernes UI/UX', 'Mobile-First', 'SEO & Speed'],
      color: 'from-swiss-red to-red-600',
      bgImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2026',
      route: ROUTES.WEBDESIGN,
      tagline: 'Präzision im Design',
    },
    {
      id: 'voice',
      title: 'Voice Agents',
      description: '24/7 KI-Telefonassistent für Schweizer KMUs',
      icon: Mic,
      features: ['24/7 Erreichbarkeit', 'Natürliche Sprache', 'Smart Automation'],
      color: 'from-blue-600 to-cyan-500',
      bgImage: 'https://images.unsplash.com/photo-1589254065878-42c9da997008?auto=format&fit=crop&q=80&w=2070',
      route: ROUTES.VOICE_AGENTS,
      tagline: 'Zukunft der Telefonie',
    },
    {
      id: 'personalized-ai',
      title: 'Personalisierte KI',
      description: 'Maßgeschneiderte KI-Lösungen für Ihr Geschäft',
      icon: Brain,
      features: ['KI-Beratung', 'Custom Solutions', 'End-to-End'],
      color: 'from-purple-600 to-pink-500',
      bgImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=2070',
      route: ROUTES.PERSONALIZED_AI,
      tagline: 'Intelligente Automatisierung',
    },
  ];

  // Parallax transform for background images
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, 30]);

  return (
    <div ref={containerRef} className="relative w-full h-screen overflow-hidden bg-black flex flex-col md:flex-row">
      <AnimatePresence>
        {sides.map((side) => {
          const isHovered = hoveredSide === side.id;
          const isOtherHovered = hoveredSide !== null && hoveredSide !== side.id;

          return (
            <PortalSide
              key={side.id}
              side={side}
              isHovered={isHovered}
              isOtherHovered={isOtherHovered}
              onMouseEnter={() => setHoveredSide(side.id)}
              onMouseLeave={() => setHoveredSide(null)}
              onClick={() => navigate(side.route)}
              parallaxY={parallaxY}
              prefersReducedMotion={prefersReducedMotion}
            />
          );
        })}
      </AnimatePresence>

      {/* Floating Ambient Effects - Enhanced with third color */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden opacity-20">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-swiss-red/20 rounded-full blur-[160px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[160px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/20 rounded-full blur-[160px]"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.35, 0.2],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        />
      </div>
    </div>
  );
};
