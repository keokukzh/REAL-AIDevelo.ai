import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, Cpu, Globe2, Layers, Zap, ShieldCheck, Database, Rocket } from 'lucide-react';

interface TechItem {
  name: string;
  logo: string;
  icon: any;
  color: string;
  description: string;
  why: string;
}

const TECH_STACK: TechItem[] = [
  {
    name: 'React 18',
    logo: '/tech/react.svg',
    icon: Code2,
    color: 'text-blue-400',
    description: 'Die weltweit führende Library für dynamische Interfaces.',
    why: 'Ermöglicht ultra-schnelle UI-Updates durch Virtual DOM und eine skalierbare Komponenten-Architektur.'
  },
  {
    name: 'TypeScript',
    logo: '/tech/typescript.svg',
    icon: ShieldCheck,
    color: 'text-blue-600',
    description: 'Typsicheres JavaScript für fehlerfreien Code.',
    why: 'Verhindert 90% der Laufzeitfehler bereits während der Entwicklung und sichert die Wartbarkeit.'
  },
  {
    name: 'Vite',
    logo: '/tech/vite.svg',
    icon: Zap,
    color: 'text-yellow-400',
    description: 'Next-Generation Frontend Tooling.',
    why: 'Bietet nahezu instantane Hot-Module-Replacement (HMR) und optimierte Produktions-Builds.'
  },
  {
    name: 'Tailwind CSS',
    logo: '/tech/tailwind.svg',
    icon: Layers,
    color: 'text-cyan-400',
    description: 'Utility-First CSS für High-Speed Styling.',
    why: 'Eliminiert unkontrolliertes CSS-Wachstum und garantiert konsistente Design-Systeme.'
  },
  {
    name: 'Framer Motion',
    logo: '/tech/framer.svg',
    icon: Rocket,
    color: 'text-purple-500',
    description: 'Premium Animations-Engine.',
    why: 'Ermöglicht komplexe 3D- und Gesten-basierte Animationen mit minimalem Performance-Overhead.'
  },
  {
    name: 'Supabase',
    logo: '/tech/supabase.svg',
    icon: Database,
    color: 'text-emerald-500',
    description: 'BaaS (Backend as a Service) für Skalierbarkeit.',
    why: 'Echtzeit-Datenbanken und sichere Authentifizierung ohne komplexe Server-Infrastruktur.'
  }
];

export const WebdesignTechStack: React.FC = () => {
  const [activeTech, setActiveTech] = useState<TechItem | null>(null);

  return (
    <section className="py-24 bg-slate-950/50 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 mb-4"
          >
            <Cpu className="text-swiss-red" size={20} />
            <span className="text-swiss-red font-mono text-sm font-bold uppercase tracking-widest">Die Engine</span>
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-bold font-display text-white mb-6">
            Unser <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">Tech-Ecosystem</span>
          </h2>
          <p className="text-gray-400 max-w-2xl text-lg font-light">
            Wir setzen nicht auf Trends, sondern auf Industriestandards. Jede Technologie in unserem Stack ist darauf optimiert, maximale Performance und Sicherheit zu liefern.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TECH_STACK.map((tech, idx) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onMouseEnter={() => setActiveTech(tech)}
              onMouseLeave={() => setActiveTech(null)}
              className="group relative bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-8 hover:border-white/20 transition-all duration-500 cursor-default overflow-hidden"
            >
              {/* Hover Glow */}
              <div className={`absolute -right-8 -top-8 w-32 h-32 ${tech.color.replace('text-', 'bg-')}/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className="relative z-10">
                <div className={`mb-6 p-3 w-fit rounded-xl bg-white/5 ${tech.color} border border-white/10 group-hover:scale-110 transition-transform duration-500`}>
                  <tech.icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{tech.name}</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">{tech.description}</p>
                
                <AnimatePresence>
                  {activeTech?.name === tech.name && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pt-4 border-t border-white/5"
                    >
                      <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-2">Technical Rationale</div>
                      <p className="text-xs text-gray-300 italic leading-relaxed">
                        "{tech.why}"
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Decorative Corner */}
              <div className="absolute bottom-4 right-4 text-white/5 group-hover:text-white/10 transition-colors">
                <tech.icon size={48} strokeWidth={1} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Background Decor */}
      <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-y-1/2" />
    </section>
  );
};
