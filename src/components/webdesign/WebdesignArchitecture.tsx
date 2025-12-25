import React from 'react';
import { motion } from 'framer-motion';
import { Network, Server, Globe2, ShieldCheck, Zap, Layers } from 'lucide-react';

export const WebdesignArchitecture: React.FC = () => {
  return (
    <section className="py-24 bg-slate-950 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          {/* Left Side: Visual Blueprint */}
          <div className="w-full lg:w-1/2 relative h-[500px] flex items-center justify-center">
             {/* Background Particles for filling space */}
             <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(6)].map((_, i) => (
                   <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ 
                         opacity: [0, 0.4, 0],
                         scale: [1, 2, 1],
                         x: [0, (i % 2 === 0 ? 1 : -1) * 200],
                         y: [0, (i % 3 === 0 ? 1 : -1) * 200]
                      }}
                      transition={{ 
                         duration: 8 + i, 
                         repeat: Infinity, 
                         delay: i * 2,
                         ease: "linear" 
                      }}
                      className="absolute left-1/2 top-1/2 w-1 h-1 bg-blue-500 rounded-full blur-[2px]"
                   />
                ))}
             </div>

             {/* Central Hub */}
             <motion.div 
               animate={{ scale: [1, 1.05, 1], rotate: [0, 5, 0] }}
               transition={{ duration: 10, repeat: Infinity }}
               className="relative w-48 h-48 bg-blue-500/10 border border-blue-500/30 rounded-3xl flex items-center justify-center z-20 shadow-[0_0_50px_rgba(59,130,246,0.2)]"
             >
                <div className="p-6 rounded-2xl bg-slate-900 border border-white/10 text-blue-400">
                   <Zap size={48} fill="currentColor" />
                </div>
                {/* Orbital Rings */}
                <div className="absolute inset-[-40px] border border-blue-500/10 rounded-full animate-[spin_20s_linear_infinite]" />
                <div className="absolute inset-[-80px] border border-white/5 rounded-full animate-[spin_30s_linear_infinite_reverse]" />
             </motion.div>

             {/* Connecting Nodes */}
             {[
               { icon: Globe2, label: 'CDN / Edge', x: -160, y: -100, delay: 0 },
               { icon: ShieldCheck, label: 'Security Layer', x: 160, y: -100, delay: 0.2 },
               { icon: Server, label: 'BaaS Engine', x: -160, y: 100, delay: 0.4 },
               { icon: Layers, label: 'Hydration', x: 160, y: 100, delay: 0.6 }
             ].map((node, i) => (
                <motion.div 
                  key={node.label}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: node.delay + 0.5 }}
                  className="absolute p-4 rounded-xl bg-slate-900/80 backdrop-blur-md border border-white/10 flex flex-col items-center gap-2 z-30 group/node"
                  style={{ transform: `translate(${node.x}px, ${node.y}px)` }}
                >
                   <node.icon className="text-blue-400 group-hover:scale-110 transition-transform" size={24} />
                   <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest">{node.label}</span>
                   
                   {/* Connection Line to Hub */}
                   <motion.div 
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none"
                   >
                      <svg width="200" height="200" className="opacity-20">
                         <line x1="100" y1="100" x2={100 - node.x/2} y2={100 - node.y/2} stroke="white" strokeWidth="1" strokeDasharray="4 4" />
                      </svg>
                   </motion.div>
                </motion.div>
             ))}

             {/* Background Grid Accent */}
             <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 [mask-image:radial-gradient(circle,white,transparent)]" />
          </div>

          {/* Right Side: Content */}
          <div className="w-full lg:w-1/2">
             <motion.div
               initial={{ opacity: 0, x: 20 }}
               whileInView={{ opacity: 1, x: 0 }}
               className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono mb-6"
             >
                <Network size={14} />
                <span>Modern Infrastructure</span>
             </motion.div>
             
             <h2 className="text-4xl md:text-6xl font-bold font-display text-white mb-8 leading-[1.1]">
                Die Anatomie der <span className="text-blue-400">Exzellenz</span>
             </h2>
             
             <div className="space-y-8">
                <div className="group">
                   <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
                      <div className="w-8 h-px bg-blue-400 group-hover:w-12 transition-all" />
                      Dezentrale Auslieferung
                   </h3>
                   <p className="text-gray-400 font-light leading-relaxed">
                      Ihre Website wird global auf über 300 Edge-Nodes gleichzeitig gehostet. Das bedeutet: <span className="text-white">Null Latenz</span>, egal ob Ihr Kunde aus Zürich oder New York zugreift.
                   </p>
                </div>

                <div className="group">
                   <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
                      <div className="w-8 h-px bg-purple-400 group-hover:w-12 transition-all" />
                      Progressive Hydration
                   </h3>
                   <p className="text-gray-400 font-light leading-relaxed">
                      Wir laden nur den Code, der wirklich benötigt wird. Der Rest wird intelligent im Hintergrund nachgeladen. Die Folge: <span className="text-white">Sofortige Interaktivität</span>.
                   </p>
                </div>

                <div className="group">
                   <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
                      <div className="w-8 h-px bg-emerald-400 group-hover:w-12 transition-all" />
                      Immutable Security
                   </h3>
                   <p className="text-gray-400 font-light leading-relaxed">
                      Statische Generation kombiniert mit sicheren API-Endpunkten macht Ihre Seite immun gegen klassische Server-Angriffe (SQL-Injection, Brute-Force).
                   </p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};
