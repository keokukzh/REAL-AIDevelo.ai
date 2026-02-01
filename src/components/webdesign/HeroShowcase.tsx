import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface WebsiteCard {
  id: number;
  title: string;
  category: string;
  tags: string[];
  offset: { x: number; y: number };
  rotation: number;
}

const WEBSITE_CARDS: WebsiteCard[] = [
  {
    id: 1,
    title: 'SaaS Webapp',
    category: 'Productivity',
    tags: ['React', 'TypeScript', 'Tailwind'],
    offset: { x: 0, y: 0 },
    rotation: 0,
  },
  {
    id: 2,
    title: 'WebGL Animation',
    category: 'Creative',
    tags: ['Three.js', 'GSAP', 'Custom'],
    offset: { x: 20, y: -15 },
    rotation: 2,
  },
  {
    id: 3,
    title: 'Branding Site',
    category: 'Portfolio',
    tags: ['Next.js', 'Framer Motion', 'Design'],
    offset: { x: -15, y: 20 },
    rotation: -1.5,
  },
];

/**
 * HeroShowcase - Versetzt gestapelte Website-Cards mit Floating-Animation
 * 
 * Features:
 * - 3-4 Website-Cards, versetzt gestapelt
 * - Floating-Animation (langsam, GPU-optimiert)
 * - Hover-Effekte: Scale, Shadow-Verstärkung, Info-Overlay
 * - Glassmorphism-Design mit weichen Schatten
 */
export const HeroShowcase: React.FC = () => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="relative w-full aspect-[4/3] lg:aspect-[16/10]">
      {WEBSITE_CARDS.map((card, index) => {
        const isHovered = hoveredCard === card.id;
        const delay = index * 0.2;

        return (
          <motion.div
            key={card.id}
            className="absolute inset-0"
            style={{
              transform: `translate(${card.offset.x}px, ${card.offset.y}px) rotate(${card.rotation}deg)`,
              zIndex: WEBSITE_CARDS.length - index + (isHovered ? 10 : 0),
              willChange: isHovered ? 'transform' : 'auto',
            }}
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.9 }}
            animate={
              prefersReducedMotion
                ? { opacity: 1 }
                : {
                    opacity: 1,
                    scale: 1,
                    y: [0, -12, 0],
                    rotate: [card.rotation, card.rotation + 1, card.rotation],
                  }
            }
            transition={
              prefersReducedMotion
                ? {}
                : {
                    opacity: { duration: 0.6, delay },
                    scale: { duration: 0.6, delay },
                    y: {
                      duration: 4 + index * 0.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: delay + 0.5,
                    },
                    rotate: {
                      duration: 5 + index * 0.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: delay + 0.5,
                    },
                  }
            }
            onHoverStart={() => setHoveredCard(card.id)}
            onHoverEnd={() => setHoveredCard(null)}
            whileHover={prefersReducedMotion ? {} : { scale: 1.03, z: 50 }}
            aria-label={`${card.title} - ${card.category}`}
          >
            <motion.div
                    className="relative w-full h-full bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[1.5rem] lg:rounded-[2rem] overflow-hidden shadow-2xl cursor-pointer group transition-all duration-300"
              style={{
                boxShadow: isHovered
                  ? '0 20px 60px -10px rgba(0, 0, 0, 0.5), 0 0 40px -10px rgba(34, 211, 238, 0.3)'
                  : '0 10px 40px -10px rgba(0, 0, 0, 0.4)',
              }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {/* Placeholder Website Structure */}
              <div className="absolute inset-0 flex flex-col">
                {/* Header Area */}
                <div className="h-16 bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-b border-white/10 flex items-center px-6">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                  </div>
                  <div className="ml-4 h-4 w-32 bg-white/10 rounded" />
                </div>

                {/* Content Area */}
                <div className="flex-1 p-6 space-y-4">
                  <div className="h-6 w-3/4 bg-white/10 rounded" />
                  <div className="h-4 w-full bg-white/5 rounded" />
                  <div className="h-4 w-5/6 bg-white/5 rounded" />
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="aspect-square bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-lg border border-white/5" />
                    ))}
                  </div>
                </div>

                {/* Footer Area */}
                <div className="h-12 bg-gradient-to-r from-slate-800/30 to-slate-900/30 border-t border-white/10 flex items-center justify-center">
                  <div className="h-3 w-24 bg-white/10 rounded" />
                </div>
              </div>

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />

              {/* Hover Overlay with Tags */}
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center p-6 pointer-events-none"
                >
                  <div className="text-center space-y-3">
                    <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest">
                      {card.category}
                    </div>
                    <h3 className="text-xl font-bold text-white">{card.title}</h3>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {card.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white/80"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
};
