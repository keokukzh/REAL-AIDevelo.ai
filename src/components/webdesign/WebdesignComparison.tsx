import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, Shield, Globe, Zap, Heart, TrendingUp, Lock } from 'lucide-react';

const COMPARISON_DICTIONARY = {
  de: {
    title: "Digital Genesis vs.",
    titleHighlight: "Standard-Baukasten",
    sub: "Warum billige Lösungen langfristig teuer werden. Wir bauen keine \"Websites\" – wir bauen digitale Assets.",
    featureLabel: "Feature",
    legacyLabel: "Legacy Builder",
    upgradeTitle: "Bereit für das Upgrade auf",
    upgradeHighlight: "Überlegene Tech",
    fast: "Schnell",
    secure: "Sicher",
    scalable: "Skalierbar",
    features: [
      {
        name: 'Performance (LCP)',
        genesis: '0.8s - 1.2s',
        legacy: '4.0s - 7.5s',
      },
      {
        name: 'SEO Ranking Potential',
        genesis: 'Maximale Kontrolle (Custom Meta)',
        legacy: 'Eingeschränkt (Template-Limits)',
      },
      {
        name: 'Besitzverhältnis',
        genesis: '100% Code-Eigentum',
        legacy: 'Vendor Lock-in (Monatlich)',
      },
      {
        name: 'Sicherheits-Standard',
        genesis: 'Cloud-Hosting & Edge-Security',
        legacy: 'Geteilte Server (Sicherheitslücken)',
      },
      {
        name: 'Ladezeiten & Conversion',
        genesis: 'High-Impact (Niedrige Absprungrate)',
        legacy: 'Standard (Hohe Absprungrate)',
      }
    ]
  },
  en: {
    title: "Digital Genesis vs.",
    titleHighlight: "Standard Builder",
    sub: "Why cheap solutions become expensive in the long run. We don't build \"websites\" – we build digital assets.",
    featureLabel: "Feature",
    legacyLabel: "Legacy Builder",
    upgradeTitle: "Ready to upgrade to",
    upgradeHighlight: "Superior Tech",
    fast: "Fast",
    secure: "Secure",
    scalable: "Scalable",
    features: [
      {
        name: 'Performance (LCP)',
        genesis: '0.8s - 1.2s',
        legacy: '4.0s - 7.5s',
      },
      {
        name: 'SEO Ranking Potential',
        genesis: 'Maximum Control (Custom Meta)',
        legacy: 'Limited (Template Limits)',
      },
      {
        name: 'Ownership',
        genesis: '100% Code Ownership',
        legacy: 'Vendor Lock-in (Monthly)',
      },
      {
        name: 'Security Standard',
        genesis: 'Cloud Hosting & Edge Security',
        legacy: 'Shared Servers (Security Gaps)',
      },
      {
        name: 'Loading Times & Conversion',
        genesis: 'High-Impact (Low Bounce Rate)',
        legacy: 'Standard (High Bounce Rate)',
      }
    ]
  }
};

export const WebdesignComparison: React.FC<{ lang?: 'de' | 'en' }> = ({ lang = 'de' }) => {
  const t = COMPARISON_DICTIONARY[lang];
  const featuresData = t.features.map((f, i) => ({
    ...f,
    icon: [Zap, TrendingUp, Lock, Shield, Globe][i]
  }));

  return (
    <section className="py-24 bg-slate-950 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-bold font-display text-white mb-6"
          >
            {t.title} <span className="text-gray-600">{t.titleHighlight}</span>
          </motion.h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            {t.sub}
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-white/10 rounded-3xl overflow-hidden bg-slate-900/20 backdrop-blur-xl">
            {/* Header Labels (Desktop) */}
            <div className="hidden md:block p-8 bg-white/5 border-b border-white/10">
              <div className="text-sm font-mono text-white/30 uppercase tracking-widest">{t.featureLabel}</div>
            </div>
            <div className="hidden md:block p-8 bg-blue-600/10 border-b border-blue-500/20">
              <div className="text-xl font-bold text-blue-400 flex items-center gap-2">
                 Digital Genesis <Zap size={18} />
              </div>
            </div>
            <div className="hidden md:block p-8 bg-white/5 border-b border-white/10">
              <div className="text-lg font-bold text-gray-500">{t.legacyLabel}</div>
            </div>

            {/* Comparison Rows */}
            {featuresData.map((feature, idx) => (
              <React.Fragment key={feature.name}>
                {/* Feature Name */}
                <div className="p-6 md:p-8 flex items-center gap-4 bg-white/5 border-b border-white/5">
                   <div className="p-2 rounded-lg bg-white/5 text-gray-400">
                      <feature.icon size={20} />
                   </div>
                   <span className="text-gray-200 font-medium">{feature.name}</span>
                </div>
                
                {/* Genesis Value */}
                <div className="p-6 md:p-8 bg-blue-500/5 border-b border-blue-500/10 flex flex-col justify-center">
                   <div className="flex items-center gap-2 text-white font-bold text-lg mb-1">
                      <Check className="text-emerald-400" size={18} />
                      {feature.genesis}
                   </div>
                   <div className="md:hidden text-[10px] text-blue-400/50 uppercase font-mono">Digital Genesis</div>
                </div>
                
                {/* Legacy Value */}
                <div className="p-6 md:p-8 bg-white/5 border-b border-white/5 flex flex-col justify-center">
                   <div className="flex items-center gap-2 text-gray-500 line-through decoration-gray-500/30">
                      <X className="text-rose-500" size={18} />
                      {feature.legacy}
                   </div>
                   <div className="md:hidden text-[10px] text-gray-600 uppercase font-mono">{t.legacyLabel}</div>
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
               {t.upgradeTitle} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">{t.upgradeHighlight}</span>?
             </p>
             <div className="flex items-center justify-center gap-8 text-sm font-mono text-gray-500">
                <div className="flex items-center gap-2">
                   <Zap size={14} className="text-emerald-500" /> {t.fast}
                </div>
                <div className="flex items-center gap-2">
                   <Shield size={14} className="text-blue-500" /> {t.secure}
                </div>
                <div className="flex items-center gap-2">
                   <TrendingUp size={14} className="text-purple-500" /> {t.scalable}
                </div>
             </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
