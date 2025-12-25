import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useVelocity, useTransform } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface BentoCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
  index: number;
  renderDemo?: () => React.ReactNode;
}

const BentoCard = React.memo<BentoCardProps>(({ icon: Icon, title, description, className = "", index, renderDemo }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Velocity tracking for dynamic glow
  const xVelocity = useVelocity(mouseX);
  const yVelocity = useVelocity(mouseY);
  
  // Increase spotlight size/intensity based on speed
  const spotlightSize = useTransform(
    [xVelocity, yVelocity],
    ([latestX, latestY]) => {
      const speed = Math.sqrt(Math.pow(latestX as number, 2) + Math.pow(latestY as number, 2));
      return 300 + Math.min(speed / 5, 200);
    }
  );

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const { left, top } = cardRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      tabIndex={0}
      role="button"
      aria-label={`${title}: ${description}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          // Action for the card if needed
        }
      }}
      className={`relative group overflow-hidden rounded-3xl border border-white/10 bg-slate-900/50 p-8 flex flex-col justify-between h-full transition-all duration-300 hover:border-swiss-red/30 focus:outline-none focus:ring-2 focus:ring-swiss-red/50 ${className}`}
    >
      {/* Dynamic Velocity-based Spotlight Effect */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useTransform(spotlightSize, (size) => 
            `radial-gradient(${size}px circle at ${mouseX.get()}px ${mouseY.get()}px, rgba(218, 41, 28, 0.15), transparent 80%)`
          ),
        }}
      />

      <div className="relative z-10">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-swiss-red/10 text-swiss-red group-hover:scale-110 group-hover:bg-swiss-red group-hover:text-white transition-all duration-300">
          <Icon size={24} />
        </div>
        <h3 className="mb-2 text-2xl font-bold text-white group-hover:text-swiss-red transition-colors">
          {title}
        </h3>
        <p className="text-gray-400 group-hover:text-gray-300 transition-colors line-clamp-3 mb-6">
          {description}
        </p>

        {/* Mico-Demo Area */}
        {renderDemo && (
          <div className="mt-4 p-4 rounded-xl bg-black/40 border border-white/5 overflow-hidden min-h-[120px] flex items-center justify-center grayscale group-hover:grayscale-0 transition-all duration-500">
             {renderDemo()}
          </div>
        )}
      </div>

      <div className="relative z-10 mt-8 flex items-center gap-2 text-sm font-bold text-swiss-red opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0 transform duration-300">
        Mehr erfahren
        <span className="text-lg">→</span>
      </div>
    </motion.div>
  );
});

BentoCard.displayName = 'BentoCard';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  renderDemo?: () => React.ReactNode;
}

export const BentoGrid = React.memo<{ features: Feature[] }>(({ features }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[280px]">
      {/* Featured Big Card */}
      {features[0] && (
        <div className="md:col-span-8 md:row-span-2">
          <BentoCard 
            {...features[0]} 
            index={0} 
            className="bg-gradient-to-br from-slate-900 to-slate-950"
          />
        </div>
      )}

      {/* Two Regular Spans */}
      {features[1] && (
        <div className="md:col-span-4 md:row-span-1">
          <BentoCard {...features[1]} index={1} />
        </div>
      )}
      {features[2] && (
        <div className="md:col-span-4 md:row-span-1">
          <BentoCard {...features[2]} index={2} />
        </div>
      )}

      {/* Complex Row */}
      {features[3] && (
        <div className="md:col-span-4 md:row-span-2">
          <BentoCard {...features[3]} index={3} />
        </div>
      )}
      {features[4] && (
        <div className="md:col-span-8 md:row-span-1">
          <BentoCard {...features[4]} index={4} />
        </div>
      )}
      
      {/* Bottom Row */}
      {features[5] && (
        <div className="md:col-span-4 md:row-span-1">
          <BentoCard {...features[5]} index={5} />
        </div>
      )}
      {features[6] && (
        <div className="md:col-span-4 md:row-span-1">
          <BentoCard {...features[6]} index={6} />
        </div>
      )}
    </div>
  );
});

BentoGrid.displayName = 'BentoGrid';
