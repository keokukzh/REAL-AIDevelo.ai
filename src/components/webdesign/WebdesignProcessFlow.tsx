import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { FileText, CreditCard, Code, CheckCircle, LucideIcon } from 'lucide-react';
import { RevealSection } from '../layout/RevealSection';

interface ProcessStep {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

const steps: ProcessStep[] = [
  {
    number: '01',
    title: 'Digitale Vision & Analyse',
    description: 'Wir analysieren Ihre Zielgruppe und definieren die strategischen Ziele. Kein Baukasten-Einheitsbrei, sondern maßgeschneidertes Konzept.',
    icon: FileText,
    color: 'text-blue-400',
  },
  {
    number: '02',
    title: 'Design & Fundament',
    description: 'Nach dem Startschuss (100 CHF) erstellen wir das erste visuelle Konzept. Wir sichern Domain und Hosting und legen das technische Fundament.',
    icon: CreditCard,
    color: 'text-emerald-400',
  },
  {
    number: '03',
    title: 'Development & Polish',
    description: 'Transformation des Designs in pixelperfekten Code. Performance-Optimierung, SEO-Setup und Mobile-First Umsetzung in 2-3 Wochen.',
    icon: Code,
    color: 'text-purple-400',
  },
  {
    number: '04',
    title: 'Launch & Success',
    description: 'Go-Live Ihrer neuen Digital-Präsenz. Übergabe aller Zugänge, kurze Schulung und finale Qualitätskontrolle. Ready for Business.',
    icon: CheckCircle,
    color: 'text-swiss-red',
  },
];

export const WebdesignProcessFlow: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <section ref={containerRef} id="process-flow" className="py-32 relative bg-slate-950 overflow-hidden">
      {/* Background Circuit Grid */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      
      {/* Ambient Glows */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-swiss-red/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <RevealSection className="text-center mb-24 max-w-3xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-1.5 rounded-full bg-swiss-red/10 border border-swiss-red/20 text-swiss-red text-sm font-bold uppercase tracking-widest mb-6"
          >
            Workflow
          </motion.div>
          <h2 className="text-4xl md:text-6xl font-bold font-display mb-6 leading-tight">
            Vom Konzept zum <span className="text-transparent bg-clip-text bg-gradient-to-r from-swiss-red to-orange-500">Launch</span>
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            Ein transparenter, strukturierter Prozess garantiert Ergebnisse, die Ihre Erwartungen übertreffen. Keine Überraschungen, nur Fortschritt.
          </p>
        </RevealSection>

        <div className="relative max-w-5xl mx-auto">
          {/* Central Circuit Line (Desktop) */}
          <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-white/5 -translate-x-1/2 hidden md:block rounded-full">
            <motion.div 
              style={{ scaleY, transformOrigin: 'top' }}
              className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-swiss-red via-purple-500 to-blue-500 rounded-full"
            />
          </div>

          <div className="space-y-12 md:space-y-24">
            {steps.map((step, index) => {
              const isEven = index % 2 === 0;
              return (
                <div key={step.number} className={`flex flex-col md:flex-row items-center gap-8 md:gap-16 ${isEven ? '' : 'md:flex-row-reverse'}`}>
                  
                  {/* Step Card */}
                  <div className="w-full md:w-1/2">
                    <motion.div
                      initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.7, delay: 0.2 }}
                      className="group relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-swiss-red/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="relative bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-2xl hover:border-white/20 transition-colors">
                        {/* Corner Accents */}
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white/10 rounded-tl-lg group-hover:border-swiss-red/50 transition-colors" />
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white/10 rounded-tr-lg group-hover:border-blue-500/50 transition-colors" />
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white/10 rounded-bl-lg group-hover:border-purple-500/50 transition-colors" />
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white/10 rounded-br-lg group-hover:border-white/30 transition-colors" />

                        <div className="flex items-start gap-4 mb-4">
                          <span className={`text-5xl font-bold font-display opacity-20 ${step.color}`}>{step.number}</span>
                          <div className={`p-3 rounded-lg bg-white/5 border border-white/10 ${step.color}`}>
                            <step.icon size={24} />
                          </div>
                        </div>
                        
                        <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-all">
                          {step.title}
                        </h3>
                        <p className="text-gray-400 leading-relaxed font-light">
                          {step.description}
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Center Node Connection */}
                  <div className="relative z-10 hidden md:flex items-center justify-center w-12 h-12">
                     <motion.div
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="w-4 h-4 bg-slate-950 border-2 border-white/30 rounded-full z-10"
                     />
                     <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className={`absolute w-8 h-8 ${step.color.replace('text-', 'bg-')}/20 rounded-full animate-ping`}
                     />
                     {/* Horizontal Connector */}
                     <div className={`absolute h-px w-8 md:w-16 bg-gradient-to-r from-transparent via-white/20 to-transparent ${isEven ? 'right-full' : 'left-full'}`} />
                  </div>

                  {/* Spacer for the other side */}
                  <div className="w-full md:w-1/2 hidden md:block" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Pricing Summary Card */}
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ delay: 0.5 }}
           className="mt-32 relative max-w-4xl mx-auto"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-swiss-red/20 via-purple-500/20 to-blue-500/20 blur-3xl opacity-30" />
          <div className="relative bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 md:p-12 overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-swiss-red via-purple-500 to-blue-500" />
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold text-white mb-2">Transparente Preisstruktur</h3>
                <p className="text-gray-400 max-w-md">
                  Keine versteckten Kosten. Sie zahlen den Projektstart, wir liefern Ergebnisse. Die Restzahlung wird erst nach erfolgreichem Launch fällig.
                </p>
              </div>
              
              <div className="flex items-center gap-6">
                 <div className="text-right">
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-widest mb-1">Total</div>
                    <div className="text-5xl font-bold font-display text-white">599 <span className="text-2xl text-gray-400">CHF</span></div>
                 </div>
                 <div className="h-16 w-px bg-white/10" />
                 <div className="flex flex-col gap-2">
                    <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full">
                      High Performance
                    </span>
                    <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold rounded-full">
                      SEO Optimized
                    </span>
                 </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

