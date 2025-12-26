import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import {
  Palette,
  Zap,
  Search,
  Smartphone,
  BarChart2,
  Layers,
  Phone,
  Calendar,
  Brain,
  Shield,
  Clock,
  Users,
  Gauge,
} from 'lucide-react';

const webdesignFeatures = [
  { icon: Palette, title: 'Conversion UI', desc: 'Designs die verkaufen, nicht nur gut aussehen' },
  { icon: Zap, title: 'Blitzschnell', desc: 'Core Web Vitals optimiert, sub-second loads' },
  { icon: Search, title: 'SEO-First', desc: 'Struktur die Google liebt, Rankings die wachsen' },
  {
    icon: Smartphone,
    title: 'Mobile-Native',
    desc: 'Responsive ist Standard – wir bauen Mobile-First',
  },
  {
    icon: BarChart2,
    title: 'Analytics Ready',
    desc: 'Tracking & Events für datengetriebene Entscheidungen',
  },
];

const voiceFeatures = [
  {
    icon: Phone,
    title: 'Inbound & Outbound',
    desc: 'Anrufe annehmen, Leads qualifizieren, Follow-ups',
  },
  {
    icon: Calendar,
    title: 'Smart Booking',
    desc: 'Direkte Kalenderintegration, No-Shows reduzieren',
  },
  {
    icon: Brain,
    title: 'Natürliche Sprache',
    desc: 'KI die zuhört, versteht und menschlich antwortet',
  },
  { icon: Shield, title: 'Volle Kontrolle', desc: 'Jede Action nachvollziehbar, DSGVO-konform' },
  { icon: Clock, title: '24/7 Verfügbar', desc: 'Nie wieder verpasste Anrufe, auch nachts' },
  { icon: Users, title: 'CRM Integration', desc: 'Leads direkt ins System, keine manuelle Arbeit' },
];

type ViewMode = 'outcome' | 'deliverables';

export const ServicesSection: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('outcome');
  const prefersReducedMotion = useReducedMotion();

  return (
    <section id="services" className="py-20 md:py-32 relative">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Section header */}
        <div className="text-center mb-12 md:mb-16">
          <motion.span
            className="text-xs font-bold tracking-widest uppercase text-violet mb-4 block"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Services
          </motion.span>
          <motion.h2
            className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Was wir für dich bauen
          </motion.h2>
          <motion.p
            className="text-gray-400 max-w-2xl mx-auto mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Zwei Spezialisierungen. Ein Ziel: Dein Business wachsen lassen.
          </motion.p>

          {/* Toggle */}
          <motion.div
            className="inline-flex items-center p-1 bg-panel rounded-full border border-ultra-border"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <button
              onClick={() => setViewMode('outcome')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ultra-focus ${
                viewMode === 'outcome'
                  ? 'bg-gradient-to-r from-violet to-cyan text-obsidian'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Gauge className="w-4 h-4 inline mr-2" />
              Outcome
            </button>
            <button
              onClick={() => setViewMode('deliverables')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ultra-focus ${
                viewMode === 'deliverables'
                  ? 'bg-gradient-to-r from-violet to-cyan text-obsidian'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4 inline mr-2" />
              Deliverables
            </button>
          </motion.div>
        </div>

        {/* Two columns */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Webdesign Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-violet/20 flex items-center justify-center">
                <Palette className="w-5 h-5 text-violet" />
              </div>
              <h3 className="text-xl font-display font-bold text-white">Webdesign & UX</h3>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={viewMode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {webdesignFeatures.map((feature, i) => (
                  <motion.div
                    key={feature.title}
                    className="group p-4 ultra-card rounded-xl hover:border-violet/30 transition-all cursor-default"
                    initial={!prefersReducedMotion ? { opacity: 0, x: -20 } : { opacity: 1 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={!prefersReducedMotion ? { y: -2 } : undefined}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-violet/10 flex items-center justify-center shrink-0 group-hover:bg-violet/20 transition-colors">
                        <feature.icon className="w-5 h-5 text-violet" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white mb-1">{feature.title}</h4>
                        <p className="text-sm text-gray-400">
                          {viewMode === 'outcome'
                            ? feature.desc
                            : `Deliverable: ${feature.title} Implementation`}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Voice Agents Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-cyan/20 flex items-center justify-center">
                <Phone className="w-5 h-5 text-cyan" />
              </div>
              <h3 className="text-xl font-display font-bold text-white">Voice Agents</h3>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={viewMode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {voiceFeatures.map((feature, i) => (
                  <motion.div
                    key={feature.title}
                    className="group p-4 ultra-card rounded-xl hover:border-cyan/30 transition-all cursor-default"
                    initial={!prefersReducedMotion ? { opacity: 0, x: 20 } : { opacity: 1 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={!prefersReducedMotion ? { y: -2 } : undefined}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-cyan/10 flex items-center justify-center shrink-0 group-hover:bg-cyan/20 transition-colors">
                        <feature.icon className="w-5 h-5 text-cyan" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white mb-1">{feature.title}</h4>
                        <p className="text-sm text-gray-400">
                          {viewMode === 'outcome'
                            ? feature.desc
                            : `Deliverable: ${feature.title} Setup`}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};
