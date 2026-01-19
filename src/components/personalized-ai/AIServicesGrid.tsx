import React from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Zap,
  Workflow,
  Code,
  Database,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import { ScrollReveal } from '../webdesign/ScrollReveal';

interface Service {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  bgColor: string;
}

interface AIServicesGridProps {
  t: {
    servicesTitle: string;
    servicesSub: string;
    services: Service[];
  };
}

export const AIServicesGrid: React.FC<AIServicesGridProps> = ({ t }) => {
  return (
    <section
      id="services"
      className="py-24 sm:py-32 bg-slate-950/30 relative overflow-hidden"
      aria-labelledby="services-heading"
    >
      {/* Background Decorative Elements */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-swiss-red/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <ScrollReveal direction="up" className="text-center mb-20">
          <h2
            id="services-heading"
            className="text-5xl md:text-7xl font-bold font-display mb-8 tracking-tight"
          >
            {t.servicesTitle}
          </h2>
          <p className="text-gray-400 text-xl max-w-3xl mx-auto font-light leading-relaxed">
            {t.servicesSub}
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6 max-w-7xl mx-auto">
          {/* Voice Agents - Large Item */}
          <ScrollReveal direction="up" delay={0.1} className="md:col-span-4 lg:col-span-3">
            <div className="h-full p-8 sm:p-10 rounded-[2.5rem] bg-slate-900/40 backdrop-blur-xl border border-white/5 hover:border-white/20 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <MessageSquare size={120} className="text-white" />
              </div>
              <div className="relative z-10 h-full flex flex-col">
                <div className="p-4 w-fit rounded-2xl bg-white/5 border border-white/10 group-hover:bg-swiss-red/10 group-hover:border-swiss-red/20 transition-colors mb-8">
                  <MessageSquare className="w-8 h-8 text-swiss-red" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-4 tracking-tight">
                  {t.services[0].title}
                </h3>
                <p className="text-gray-400 text-lg leading-relaxed font-light mb-8">
                  {t.services[0].description}
                </p>
                <div className="mt-auto flex items-center gap-2 text-swiss-red font-mono text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
                  <span>Mehr erfahren</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Chatbot Development - Tall Item */}
          <ScrollReveal direction="up" delay={0.2} className="md:col-span-2 lg:col-span-3">
            <div className="h-full p-8 sm:p-10 rounded-[2.5rem] bg-gradient-to-br from-slate-900/60 to-slate-950/40 backdrop-blur-xl border border-white/5 hover:border-white/20 transition-all group relative overflow-hidden">
              <div className="relative z-10">
                <div className="p-4 w-fit rounded-2xl bg-white/5 border border-white/10 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20 transition-colors mb-8">
                  <Zap className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-4 tracking-tight">
                  {t.services[1].title}
                </h3>
                <p className="text-gray-400 text-lg leading-relaxed font-light">
                  {t.services[1].description}
                </p>
              </div>
            </div>
          </ScrollReveal>

          {/* Process Automation - Small Item */}
          <ScrollReveal direction="up" delay={0.3} className="md:col-span-2 lg:col-span-2">
            <div className="h-full p-8 rounded-[2rem] bg-slate-900/40 backdrop-blur-xl border border-white/5 hover:border-white/20 transition-all group">
              <div className="p-3 w-fit rounded-xl bg-white/5 border border-white/10 group-hover:bg-purple-500/10 group-hover:border-purple-500/20 transition-colors mb-6">
                <Workflow className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{t.services[2].title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed font-light">
                {t.services[2].description}
              </p>
            </div>
          </ScrollReveal>

          {/* Custom Solutions - Small Item */}
          <ScrollReveal direction="up" delay={0.4} className="md:col-span-2 lg:col-span-2">
            <div className="h-full p-8 rounded-[2rem] bg-slate-900/40 backdrop-blur-xl border border-white/5 hover:border-white/20 transition-all group">
              <div className="p-3 w-fit rounded-xl bg-white/5 border border-white/10 group-hover:bg-blue-500/10 group-hover:border-blue-500/20 transition-colors mb-6">
                <Code className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{t.services[3].title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed font-light">
                {t.services[3].description}
              </p>
            </div>
          </ScrollReveal>

          {/* CRM/ERP Integration - Small Item */}
          <ScrollReveal direction="up" delay={0.5} className="md:col-span-2 lg:col-span-2">
            <div className="h-full p-8 rounded-[2rem] bg-slate-900/40 backdrop-blur-xl border border-white/5 hover:border-white/20 transition-all group">
              <div className="p-3 w-fit rounded-xl bg-white/5 border border-white/10 group-hover:bg-amber-500/10 group-hover:border-amber-500/20 transition-colors mb-6">
                <Database className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{t.services[4].title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed font-light">
                {t.services[4].description}
              </p>
            </div>
          </ScrollReveal>

          {/* Data Analytics - Small Item */}
          <ScrollReveal direction="up" delay={0.6} className="md:col-span-4 lg:col-span-2">
            <div className="h-full p-8 rounded-[2rem] bg-slate-900/40 backdrop-blur-xl border border-white/5 hover:border-white/20 transition-all group">
              <div className="p-3 w-fit rounded-xl bg-white/5 border border-white/10 group-hover:bg-swiss-red/10 group-hover:border-swiss-red/20 transition-colors mb-6">
                <BarChart3 className="w-6 h-6 text-swiss-red" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{t.services[5].title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed font-light">
                {t.services[5].description}
              </p>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};
