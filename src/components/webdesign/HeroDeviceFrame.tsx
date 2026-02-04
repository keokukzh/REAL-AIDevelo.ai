import React, { useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { Award, Zap } from 'lucide-react';


interface HeroDeviceFrameProps {
  imageUrl?: string;
  badges?: string[];
}

/**
 * HeroDeviceFrame - 3D-Device-Frame mit Parallax und Floating-Animation
 * - Idle: leichtes Floating (y -4->4px in 4-6s Loop)
 * - Mouse Parallax: rotateX/rotateY abhängig von Mausposition, max ±8-10 Grad
 */
export const HeroDeviceFrame: React.FC<HeroDeviceFrameProps> = ({
  imageUrl = '/images/website-preview-placeholder.svg',
  badges = ['100/100 Lighthouse', '< 1 Sekunde Ladezeit'],
}) => {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse Parallax Values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring für smooth Parallax
  const springConfig = { damping: 50, stiffness: 200 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), springConfig);

  // Idle Floating Animation
  const floatingVariants = {
    animate: prefersReducedMotion
      ? {}
      : {
          y: [-4, 4, -4],
          transition: {
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        },
  };

  useEffect(() => {
    if (prefersReducedMotion || !containerRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Normalize to -0.5 to 0.5 range
      const normalizedX = (e.clientX - centerX) / rect.width;
      const normalizedY = (e.clientY - centerY) / rect.height;

      mouseX.set(Math.max(-0.5, Math.min(0.5, normalizedX)));
      mouseY.set(Math.max(-0.5, Math.min(0.5, normalizedY)));
    };

    const handleMouseLeave = () => {
      mouseX.set(0);
      mouseY.set(0);
    };

    const container = containerRef.current;
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [prefersReducedMotion, mouseX, mouseY]);

  return (
    <motion.div
      ref={containerRef}
      className="relative w-full aspect-[16/10]"
      variants={floatingVariants}
      animate="animate"
      style={
        prefersReducedMotion
          ? {}
          : {
              rotateX,
              rotateY,
              transformStyle: 'preserve-3d',
              willChange: 'transform', // GPU-Optimierung
            }
      }
    >
      {/* Device Frame Glow */}
      <div className="absolute -inset-4 bg-gradient-to-br from-cyan-500/20 via-violet-500/20 to-cyan-500/20 rounded-[2rem] blur-3xl" />

      {/* Device Container */}
      <div className="relative h-full w-full bg-slate-900/60 backdrop-blur-xl border border-white/20 rounded-[1.5rem] lg:rounded-[2.5rem] overflow-hidden shadow-2xl">
        {/* Device Screen */}
        <div className="relative w-full h-full bg-slate-900 overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Website Preview"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
              <span className="text-gray-500 text-sm">Preview</span>
            </div>
          )}
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
        </div>

        {/* Badges Overlay */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
          {badges.map((badge, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{
                delay: prefersReducedMotion ? 0 : 0.6 + index * 0.1,
                duration: 0.4,
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md border border-white/10 text-xs font-medium text-white shadow-lg"
            >
              {index === 0 ? (
                <Award size={14} className="text-emerald-400" />
              ) : (
                <Zap size={14} className="text-cyan-400" />
              )}
              <span>{badge}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
