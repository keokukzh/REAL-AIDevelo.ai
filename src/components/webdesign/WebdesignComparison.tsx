import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, Shield, Globe, Zap, Heart, TrendingUp, Lock } from 'lucide-react';

interface ComparisonFeature {
  name: string;
  genesis: string;
  legacy: string;
  isGenesisBetter: boolean;
  icon: any;
}

const COMPARISON_FEATURES: ComparisonFeature[] = [
  {
    name: 'Performance (LCP)',
    genesis: '0.8s - 1.2s',
    legacy: '4.0s - 7.5s',
    isGenesisBetter: true,
    icon: Zap
  },
  {
    name: 'SEO Ranking Potential',
    genesis: 'Maximale Kontrolle (Custom Meta)',
    legacy: 'Eingeschränkt (Template-Limits)',
    isGenesisBetter: true,
    icon: TrendingUp
  },
  {
    name: 'Besitzverhältnis',
    genesis: '100% Code-Eigentum',
    legacy: 'Vendor Lock-in (Monatlich)',
    isGenesisBetter: true,
    icon: Lock
  },
  {
    name: 'Sicherheits-Standard',
    genesis: 'Cloud-Hosting & Edge-Security',
    legacy: 'Geteilte Server (Sicherheitslücken)',
    isGenesisBetter: true,
    icon: Shield
  },
  {
    name: 'Ladezeiten & Conversion',
    genesis: 'High-Impact (Niedrige Absprungrate)',
    legacy: 'Standard (Hohe Absprungrate)',
    isGenesisBetter: true,
    icon: Globe
  }
];

export const WebdesignComparison: React.FC = () => {
  return (
    <section className="py-24 bg-slate-950 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-bold font-display text-white mb-6"
          >
            Digital Genesis vs. <span className="text-gray-600">Standard-Baukasten</span>
          </motion.h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Warum billige Lösungen langfristig teuer werden. Wir bauen keine "Websites" – wir bauen digitale Assets.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-white/10 rounded-3xl overflow-hidden bg-slate-900/20 backdrop-blur-xl">
            {/* Header Labels (Desktop) */}
            <div className="hidden md:block p-8 bg-white/5 border-b border-white/10">
              <div className="text-sm font-mono text-white/30 uppercase tracking-widest">Feature</div>
            </div>
            <div className="hidden md:block p-8 bg-swiss-red/10 border-b border-swiss-red/20">
              <div className="text-xl font-bold text-swiss-red flex items-center gap-2">
                 Digital Genesis <Zap size={18} />
              </div>
            </div>
            <div className="hidden md:block p-8 bg-white/5 border-b border-white/10">
              <div className="text-lg font-bold text-gray-500">Legacy Builder</div>
            </div>

            {/* Comparison Rows */}
            {COMPARISON_FEATURES.map((feature, idx) => (
              <React.Fragment key={feature.name}>
                {/* Feature Name */}
                <div className="p-6 md:p-8 flex items-center gap-4 bg-white/5 border-b border-white/5">
                   <div className="p-2 rounded-lg bg-white/5 text-gray-400">
                      <feature.icon size={20} />
                   </div>
                   <span className="text-gray-200 font-medium">{feature.name}</span>
                </div>
                
                {/* Genesis Value */}
                <div className="p-6 md:p-8 bg-swiss-red/5 border-b border-swiss-red/10 flex flex-col justify-center">
                   <div className="flex items-center gap-2 text-white font-bold text-lg mb-1">
                      <Check className="text-emerald-400" size={18} />
                      {feature.genesis}
                   </div>
                   <div className="md:hidden text-[10px] text-swiss-red/50 uppercase font-mono">Digital Genesis</div>
                </div>

                {/* Legacy Value */}
                <div className="p-6 md:p-8 bg-white/5 border-b border-white/5 flex flex-col justify-center">
                   <div className="flex items-center gap-2 text-gray-500 line-through decoration-gray-500/30">
                      <X className="text-rose-500" size={18} />
                      {feature.legacy}
                   </div>
                   <div className="md:hidden text-[10px] text-gray-600 uppercase font-mono">Legacy Builder</div>
                </div>
              </React.Fragment>
            ))}
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-white/10 text-center"
          >
             <p className="text-white text-lg font-medium mb-4">
               Ready to upgrade to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Superior Tech</span>?
             </p>
             <div className="flex items-center justify-center gap-8 text-sm font-mono text-gray-500">
                <div className="flex items-center gap-2">
                   <Zap size={14} className="text-emerald-500" /> Fast
                </div>
                <div className="flex items-center gap-2">
                   <Shield size={14} className="text-blue-500" /> Secure
                </div>
                <div className="flex items-center gap-2">
                   <TrendingUp size={14} className="text-purple-500" /> Scalable
                </div>
             </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
