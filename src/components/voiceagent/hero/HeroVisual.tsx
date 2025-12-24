import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export const HeroVisual = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Logic migrated from old Hero.jsx
    const canvas = canvasRef.current;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
            // Setup canvas context
            ctx.fillStyle = 'rgba(0,0,0,0)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }
  }, []);

  return (
    <div className="relative w-full max-w-2xl aspect-square md:aspect-[4/3] flex items-center justify-center overflow-hidden rounded-[40px] border border-white/5 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-sm shadow-2xl shadow-indigo-500/20 group">
      
      {/* Background Ambience - Ported from App.jsx styles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15),transparent_70%)] blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] h-[100%] bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.12),transparent_60%)] blur-2xl animate-pulse" />
      </div>

      {/* Holographic Scanline Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_100%)] z-10" />
      
      {/* Dynamic Glow Effect */}
      <div className="absolute inset-0 animate-holographic opacity-20 pointer-events-none z-10" />

      {/* Canvas Element - "The Stage" */}
      <canvas 
        ref={canvasRef}
        className="relative z-20 w-full h-full object-contain mix-blend-screen"
        width={1000} 
        height={1000}
      />

       {/* Visual Centerpiece (Replaces the 'placeholder' with the CSS Animation effects found in animations.css) */}
       <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
           <div className="relative w-64 h-64 md:w-80 md:h-80">
                {/* Outer Ring */}
               <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-spin-slow duration-[20s]" />
               <div className="absolute inset-4 rounded-full border border-indigo-500/20 animate-reverse-spin duration-[15s]" />
               
               {/* Core Pulse */}
               <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-cyan-500/5 blur-xl animate-glow-pulse" />
                    <div className="w-24 h-24 rounded-full bg-indigo-500/10 blur-xl animate-pulse" />
               </div>

               {/* Center "Lens" */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                   <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.8)] animate-ping" />
               </div>
           </div>
       </div>

    </div>
  );
};
