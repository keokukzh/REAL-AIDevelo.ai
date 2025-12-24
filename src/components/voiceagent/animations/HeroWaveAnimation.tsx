import React from 'react';
import { motion } from 'framer-motion';

export function HeroWaveAnimation() {
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-[400px] h-[120px] mx-auto mt-6">
      
      {/* Waveform Container */}
      <div className="flex items-center justify-center gap-1.5 h-16">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="w-1.5 rounded-full bg-gradient-to-t from-blue-500 to-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
            animate={{
              height: [20, Math.random() * 40 + 30, 20],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.1,
              repeatType: "mirror"
            }}
          />
        ))}
      </div>

      {/* Status Label */}
      <div className="mt-3 flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">
          Voice Engine Active
        </span>
      </div>
    </div>
  );
}
