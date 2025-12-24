import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../config/navigation';
import { Globe, Mic, ArrowRight, Zap, Shield, Sparkles } from 'lucide-react';

export const SplitPortal: React.FC = () => {
  const navigate = useNavigate();
  const [hoveredSide, setHoveredSide] = useState<'webdesign' | 'voice' | null>(null);

  const sides = [
    {
      id: 'webdesign' as const,
      title: 'Webdesign',
      description: 'Hochmoderne Websites & Digitale Erlebnisse',
      icon: Globe,
      features: ['Modernes UI/UX', 'Mobile-First', 'SEO & Speed'],
      color: 'from-swiss-red to-red-600',
      bgImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2026',
      route: ROUTES.WEBDESIGN,
      tagline: 'Präzision im Design'
    },
    {
      id: 'voice' as const,
      title: 'Voice Agents',
      description: 'KI-Telefonassistenten für Ihr Unternehmen',
      icon: Mic,
      features: ['24/7 Erreichbarkeit', 'Natürliche Sprache', 'Smart Automation'],
      color: 'from-blue-600 to-cyan-500',
      bgImage: 'https://images.unsplash.com/photo-1589254065878-42c9da997008?auto=format&fit=crop&q=80&w=2070',
      route: ROUTES.VOICE_AGENTS,
      tagline: 'Zukunft der Telefonie'
    }
  ];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black flex flex-col md:flex-row">
      <AnimatePresence>
        {sides.map((side) => {
          const isHovered = hoveredSide === side.id;
          const isOtherHovered = hoveredSide !== null && hoveredSide !== side.id;

          return (
            <motion.div
              key={side.id}
              className={`relative flex-1 h-full cursor-pointer overflow-hidden group border-white/5 border-l first:border-l-0`}
              onMouseEnter={() => setHoveredSide(side.id)}
              onMouseLeave={() => setHoveredSide(null)}
              onClick={() => navigate(side.route)}
              initial={{ flex: 1 }}
              animate={{ 
                flex: isHovered ? 1.5 : isOtherHovered ? 0.5 : 1,
                transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
              }}
            >
              {/* Background Image with Parallax & Gradients */}
              <motion.div 
                className="absolute inset-0 z-0 scale-110"
                animate={{ 
                  scale: isHovered ? 1.05 : 1.1,
                  filter: isHovered ? 'blur(0px) brightness(0.6)' : 'blur(4px) brightness(0.3)',
                }}
                transition={{ duration: 1.2 }}
              >
                <img 
                  src={side.bgImage} 
                  alt={side.title}
                  className="w-full h-full object-cover"
                />
              </motion.div>

              {/* Dynamic Gradient Overlay */}
              <div className={`absolute inset-0 z-10 bg-gradient-to-t via-black/40 to-transparent ${isHovered ? 'opacity-90' : 'opacity-60'} transition-opacity duration-700`} />
              <div className={`absolute inset-0 z-10 bg-gradient-to-r ${side.id === 'webdesign' ? 'from-black/80 to-transparent' : 'from-transparent to-black/80'} opacity-60`} />

              {/* Accent Color Glow */}
              <motion.div 
                className={`absolute inset-0 z-10 bg-gradient-to-br ${side.color} opacity-0`}
                animate={{ opacity: isHovered ? 0.15 : 0 }}
                transition={{ duration: 0.5 }}
              />

              {/* Content Container */}
              <div className={`relative z-20 h-full flex flex-col items-center justify-center p-8 md:p-16 text-center transition-all duration-700 ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-4 md:translate-y-0 opacity-80'}`}>
                
                {/* Visual Accent for Voice Agent (Waveform) */}
                {side.id === 'voice' && isHovered && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-20 w-full h-32 flex items-center justify-center gap-1">
                    {[...Array(12)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-cyan-400 rounded-full"
                        animate={{ height: [20, 80, 20] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                      />
                    ))}
                  </div>
                )}

                {/* Visual Accent for Webdesign (Grid) */}
                {side.id === 'webdesign' && isHovered && (
                  <div className="absolute inset-0 pointer-events-none opacity-10"
                       style={{ background: 'radial-gradient(circle, rgba(218,41,28,0.2) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                )}

                {/* Subtitle / Tagline */}
                <motion.span 
                  className={`text-xs md:text-sm font-bold tracking-[0.3em] uppercase mb-4 block ${side.id === 'webdesign' ? 'text-swiss-red' : 'text-cyan-400'}`}
                  animate={{ y: isHovered ? 0 : 20, opacity: isHovered ? 1 : 0 }}
                >
                  {side.tagline}
                </motion.span>

                {/* Icon Container */}
                <motion.div 
                  className={`mb-8 p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl relative group-hover:border-white/20 shadow-2xl transition-colors`}
                  animate={{ scale: isHovered ? 1.1 : 1 }}
                >
                  <side.icon className={`w-12 h-12 md:w-16 md:h-16 ${side.id === 'webdesign' ? 'text-swiss-red' : 'text-cyan-400'}`} />
                  {isHovered && (
                    <motion.div 
                      layoutId="glow"
                      className={`absolute inset-0 rounded-3xl blur-2xl opacity-50 z-[-1] bg-gradient-to-br ${side.color}`}
                    />
                  )}
                </motion.div>

                {/* Title */}
                <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold font-display text-white mb-6 tracking-tight">
                  {side.title}
                </h2>

                {/* Description */}
                <p className="text-lg md:text-xl text-gray-300 max-w-md mx-auto mb-10 leading-relaxed font-medium">
                  {side.description}
                </p>

                {/* Dynamic Features List */}
                <motion.div 
                  className="flex flex-wrap justify-center gap-4 mb-12"
                  animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 40 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  {side.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5 backdrop-blur-sm text-sm font-semibold text-white">
                      <Sparkles size={14} className={side.id === 'webdesign' ? 'text-swiss-red' : 'text-cyan-400'} />
                      {feature}
                    </div>
                  ))}
                </motion.div>

                {/* Main CTA */}
                <div className="relative group">
                  <motion.div 
                    className={`flex items-center gap-4 px-10 py-5 rounded-full text-lg font-bold transition-all duration-300 ${side.id === 'webdesign' ? 'bg-swiss-red text-white' : 'bg-cyan-500 text-black'}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Entdecken
                    <ArrowRight size={24} />
                  </motion.div>
                </div>
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
        })}
      </AnimatePresence>

      {/* Floating Ambient Effects */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-swiss-red/20 rounded-full blur-[160px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[160px]" />
      </div>
    </div>
  );
};
