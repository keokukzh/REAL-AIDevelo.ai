import React, { useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Magnetic } from './Magnetic';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  index: number;
}

export const FeatureCard = React.memo<FeatureCardProps>(({ icon: Icon, title, description, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 700 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [7.5, -7.5]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-7.5, 7.5]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: isHovered ? rotateX : 0,
        rotateY: isHovered ? rotateY : 0,
        transformStyle: 'preserve-3d',
      }}
      className="group relative bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 transition-all duration-300 hover:border-swiss-red/50 hover:shadow-2xl hover:shadow-swiss-red/20 h-full"
      role="article"
      aria-labelledby={`feature-title-${index}`}
      aria-describedby={`feature-desc-${index}`}
    >
      {/* Gradient Border on Hover */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-swiss-red/30 via-red-500/20 to-swiss-red/30 p-[1px]">
          <div className="h-full w-full rounded-xl bg-slate-900/50" />
        </div>
      </div>

      {/* Shimmer Effect */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </div>

      <div className="relative z-10" style={{ transform: 'translateZ(20px)' }}>
        {/* Icon with Animation */}
        <Magnetic strength={0.5}>
          <motion.div
            className="w-12 h-12 bg-swiss-red/20 rounded-lg flex items-center justify-center mb-4 relative overflow-hidden"
            aria-hidden="true"
            animate={isHovered ? { scale: 1.1, rotate: [0, -5, 5, -5, 0] } : { scale: 1, rotate: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-swiss-red/40 to-red-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Icon className="w-6 h-6 text-swiss-red relative z-10" aria-hidden="true" />
          </motion.div>
        </Magnetic>

        <h3
          id={`feature-title-${index}`}
          className="text-xl font-semibold mb-2 text-white group-hover:text-swiss-red transition-colors duration-300"
          style={{ transform: 'translateZ(30px)' }}
        >
          {title}
        </h3>
        <p
          id={`feature-desc-${index}`}
          className="text-gray-400 text-sm leading-relaxed group-hover:text-gray-300 transition-colors duration-300"
          style={{ transform: 'translateZ(10px)' }}
        >
          {description}
        </p>
      </div>
    </motion.article>
  );
});

FeatureCard.displayName = 'FeatureCard';
