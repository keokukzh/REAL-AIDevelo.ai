import { useEffect, useRef } from "react";
import { DotLottie } from "@lottiefiles/dotlottie-web";

export function HeroLottie() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Player with best settings for Swiss quality
    const player = new DotLottie({
      autoplay: true,
      loop: true,
      mode: "normal", // 'bounce' can look unnatural for tech/voice waves
      canvas: canvasRef.current,
      src: "/animations/hero_agent.lottie",
      backgroundColor: "transparent",
    });

    return () => {
        player.destroy();
    };
  }, []);

  return (
    <div className="relative w-full max-w-xl aspect-[4/3] mx-auto rounded-[32px] overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-[#020617] border border-cyan-500/30 shadow-[0_0_80px_rgba(34,211,238,0.25)] flex items-center justify-center">
      {/* Glow Center */}
      <div className="absolute inset-0 bg-radial from-cyan-500/5 to-transparent pointer-events-none" />
      
      {/* Canvas Layer */}
      <canvas ref={canvasRef} className="w-full h-full object-contain relative z-10" />
      
       {/* Floating Status Badge - Re-integrated for context */}
       <div className="absolute right-6 top-6 z-20 rounded-xl bg-slate-900/60 border border-emerald-500/30 px-3 py-1.5 text-xs text-slate-100 shadow-lg backdrop-blur-sm animate-in fade-in zoom-in duration-500 delay-500 fill-mode-forwards opacity-0">
        <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Live Agent</span>
        </div>
      </div>
    </div>
  );
}
