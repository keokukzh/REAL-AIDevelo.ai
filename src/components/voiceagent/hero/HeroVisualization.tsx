import { motion } from "framer-motion";

const bars = Array.from({ length: 16 });

export function HeroVisualization() {
  return (
    <div className="relative w-full max-w-xl mx-auto aspect-[4/3] rounded-[32px] bg-gradient-to-br from-slate-900 via-slate-950 to-black border border-slate-800/60 shadow-[0_0_80px_rgba(15,118,255,0.35)] overflow-hidden">
      {/* Glow center */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.15),transparent_60%)] pointer-events-none" />

      {/* Equalizer bars */}
      <div className="relative z-10 flex h-full items-center justify-center gap-1.5 px-6">
        {bars.map((_, i) => (
          <motion.div
            key={i}
            className="w-[8px] rounded-full bg-gradient-to-t from-slate-700 via-sky-400 to-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.4)]"
            initial={{ height: 40 + (i % 4) * 10 }}
            animate={{
              height: [
                40 + (i % 4) * 10,
                90 + (i % 5) * 12,
                50 + (i % 3) * 8,
              ],
            }}
            transition={{
              duration: 1.8 + (i % 5) * 0.1,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
              delay: i * 0.03,
            }}
          />
        ))}
      </div>

      {/* Pulsierende Ringe / Scanlines */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[1, 2, 3].map((ring) => (
          <motion.div
            key={ring}
            className="absolute rounded-full border border-cyan-500/10"
            style={{
              width: `${40 + ring * 25}%`,
              height: `${40 + ring * 25}%`,
            }}
            initial={{ opacity: 0.1, scale: 0.95 }}
            animate={{ opacity: [0.1, 0.3, 0.1], scale: [0.95, 1.05, 0.95] }}
            transition={{
              duration: 6 + ring,
              repeat: Infinity,
              ease: "easeInOut",
              delay: ring * 0.5,
            }}
          />
        ))}
      </div>

      {/* Kleine Call-Pings */}
      <motion.div
        className="absolute right-6 top-6 rounded-xl bg-slate-900/90 border border-emerald-500/30 px-3 py-2 text-xs text-slate-100 shadow-xl shadow-emerald-500/10 backdrop-blur-md"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: [0, 1, 1, 0], y: [0, 0, 0, -6] }}
        transition={{
          duration: 6,
          repeat: Infinity,
          repeatDelay: 4,
          ease: "easeInOut",
          delay: 2
        }}
      >
        <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider">Erfolg</span>
        </div>
        <div className="text-sm font-semibold">Anruf in Termin verwandelt</div>
      </motion.div>

      <motion.div
        className="absolute left-6 bottom-6 rounded-xl bg-slate-900/90 border border-sky-500/30 px-3 py-2 text-xs text-slate-100 shadow-xl shadow-sky-500/10 backdrop-blur-md"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: [0, 1, 1, 0], y: [6, 0, 0, 6] }}
        transition={{
          duration: 7,
          repeat: Infinity,
          repeatDelay: 3,
          ease: "easeInOut",
          delay: 5
        }}
      >
        <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
            <span className="text-[10px] text-sky-400 font-medium uppercase tracking-wider">Sync</span>
        </div>
        <div className="text-sm font-semibold">Kalender aktualisiert</div>
      </motion.div>
      
      {/* Glas Overlay Texture */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none mix-blend-overlay" />
    </div>
  );
}
