import { motion } from "framer-motion";

export function HeroHologram() {
  return (
    <div className="relative w-full max-w-xl mx-auto aspect-[4/3] rounded-[32px] bg-gradient-to-br from-slate-900 via-slate-950 to-[#020617] border border-cyan-500/20 shadow-[0_0_80px_rgba(34,211,238,0.15)] overflow-hidden">
      
      {/* Hologram-Boden (Fading Floor) */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-cyan-500/10 via-cyan-500/5 to-transparent blur-2xl pointer-events-none" />

      {/* Cyber-Scanlines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.15] z-0">
        {[...Array(25)].map((_, i) => (
          <motion.div
            key={i}
            className="w-full border-t border-cyan-400/40"
            style={{ position: 'absolute', top: `${i * 4}%` }}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
              delay: i * 0.1,
            }}
          />
        ))}
      </div>

      {/* Pulsierende Voice-Ringe (Radar) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[1, 2, 3].map((ring) => (
          <motion.div
            key={ring}
            className="absolute rounded-full border border-cyan-400/20"
            style={{
              width: `${40 + ring * 15}%`,
              height: `${50 + ring * 15}%`,
            }}
            initial={{ opacity: 0, scale: 0.8, rotateX: 60 }}
            animate={{ 
                opacity: [0, 0.3, 0], 
                scale: [0.8, 1.1, 1.2],
                rotateX: 60 
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear",
              delay: ring * 1.2,
            }}
          />
        ))}
      </div>

      {/* Holografische Agent-Silhouette (SVG) */}
      <div className="relative z-10 h-full flex items-end justify-center pb-8">
        <motion.svg
          viewBox="0 0 200 240"
          className="h-[85%] w-auto drop-shadow-[0_0_20px_rgba(34,211,238,0.4)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <defs>
            <linearGradient id="holoGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.95" />   {/* Cyan-400 */}
              <stop offset="40%" stopColor="#0ea5e9" stopOpacity="0.6" />   {/* Sky-500 */}
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.1" />  {/* Fade out */}
            </linearGradient>
            <filter id="glow">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
          </defs>

          {/* Abstrahierter Tech-Torso */}
          <motion.path
            d="M50 200 C 50 160, 150 160, 150 200 L 150 240 L 50 240 Z"
            fill="url(#holoGrad)"
            opacity="0.4"
          />

          {/* Kopf/Schulter-Shape – stilisiert, neutral */}
          <motion.path
            d="M100 40c-18 0-32 14-32 32 0 16 10 32 32 32s32-16 32-32c0-18-14-32-32-32zm0 88c-30 0-54 18-64 46-2 6 2 12 8 12h112c6 0 10-6 8-12-10-28-34-46-64-46z"
            fill="url(#holoGrad)"
            stroke="#67e8f9"
            strokeWidth="1.5"
            filter="url(#glow)"
            animate={{ filter: ["url(#glow)", "brightness(1.2)", "url(#glow)"] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          
          {/* „Datenlinien“ im Gesicht (Augenhöhe) */}
          <motion.line
            x1="80"
            y1="70"
            x2="120"
            y2="70"
            stroke="#a5f3fc"
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: [0, 1, 1, 0], opacity: [0, 1, 0] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatDelay: 1,
              ease: "easeInOut",
            }}
          />
          
          {/* Vertikale Scan-Line über den Agenten */}
          <motion.rect
            x="0"
            y="0"
            width="200"
            height="2"
            fill="#a5f3fc"
            opacity="0.5"
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: [0, 240], opacity: [0, 0.5, 0] }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </motion.svg>
      </div>

      {/* Floating Status Badge */}
      <motion.div
        className="absolute right-6 top-6 z-20 rounded-xl bg-slate-900/80 border border-emerald-500/30 px-3 py-2 text-xs text-slate-100 shadow-lg shadow-emerald-500/10 backdrop-blur-md"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1, duration: 0.8 }}
      >
        <div className="flex items-center gap-2 mb-0.5">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Live Agent</span>
        </div>
        <div className="text-xs font-medium text-slate-300">Anruf wird übernommen...</div>
      </motion.div>
      
       {/* Floating Audio Analysis Badge */}
       <motion.div
        className="absolute left-6 bottom-8 z-20 rounded-xl bg-slate-900/80 border border-sky-500/30 px-3 py-2 text-xs text-slate-100 shadow-lg shadow-sky-500/10 backdrop-blur-md"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.5, duration: 0.8 }}
      >
        <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] text-sky-400 font-bold uppercase tracking-widest">Voice Analysis</span>
        </div>
        <div className="flex items-end gap-0.5 h-3 mt-1">
             {[...Array(5)].map((_,i) => (
                <motion.div 
                    key={i}
                    className="w-1 bg-sky-400 rounded-full"
                    animate={{ height: ["20%", "100%", "40%"] }}
                    transition={{ duration: 0.5 + Math.random() * 0.5, repeat: Infinity, repeatType: "mirror" }}
                />
             ))}
        </div>
      </motion.div>

    </div>
  );
}
