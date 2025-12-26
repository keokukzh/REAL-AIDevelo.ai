import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { Search, Lightbulb, Code2, Rocket, Check } from 'lucide-react';

const steps = [
  {
    icon: Search,
    title: 'Discovery',
    subtitle: 'Verstehen',
    description:
      'Wir analysieren dein Business, deine Ziele und deine Pain Points. Kein Bullshit-Briefing.',
    deliverables: ['Audit Report', 'Scope Definition', 'Timeline'],
    timeframe: 'Schneller Kick-off',
  },
  {
    icon: Lightbulb,
    title: 'Prototype',
    subtitle: 'Visualisieren',
    description: 'Interaktive Prototypen und Konzepte – du siehst das Ergebnis, bevor wir bauen.',
    deliverables: ['Wireframes', 'Design Mockups', 'Flow Documentation'],
    timeframe: 'Frühe Validierung',
  },
  {
    icon: Code2,
    title: 'Build',
    subtitle: 'Entwickeln',
    description:
      'Sauberer Code, moderne Architektur, kontinuierliches Deployment. Keine Überraschungen.',
    deliverables: ['Production Code', 'Testing', 'Documentation'],
    timeframe: 'Agile Sprints',
  },
  {
    icon: Rocket,
    title: 'Scale',
    subtitle: 'Wachsen',
    description: 'Launch, Monitoring, Iteration. Wir bleiben dran und optimieren mit dir zusammen.',
    deliverables: ['Launch Support', 'Analytics', 'Ongoing Optimization'],
    timeframe: 'Langfristiger Partner',
  },
];

export const ProcessTimeline: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = React.useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const lineHeight = useTransform(scrollYProgress, [0.1, 0.8], ['0%', '100%']);

  return (
    <section id="process" className="py-20 md:py-32 relative overflow-hidden" ref={containerRef}>
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-glow-violet opacity-30 pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Section header */}
        <div className="text-center mb-16 md:mb-24">
          <motion.span
            className="text-xs font-bold tracking-widest uppercase text-electric-blue mb-4 block"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Prozess
          </motion.span>
          <motion.h2
            className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Wie wir arbeiten
          </motion.h2>
          <motion.p
            className="text-gray-400 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Transparent, iterativ, ergebnisorientiert. Vier Phasen vom Erstkontakt bis zum
            Live-System.
          </motion.p>
        </div>

        {/* Timeline */}
        <div className="relative max-w-4xl mx-auto">
          {/* Progress line - Desktop */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2">
            <div className="absolute inset-0 bg-ultra-border" />
            {!prefersReducedMotion && (
              <motion.div
                className="absolute top-0 left-0 w-full bg-gradient-to-b from-violet via-cyan to-electric-blue"
                style={{ height: lineHeight }}
              />
            )}
          </div>

          {/* Steps */}
          <div className="space-y-12 md:space-y-0">
            {steps.map((step, i) => {
              const isEven = i % 2 === 0;

              return (
                <motion.div
                  key={step.title}
                  className={`relative md:grid md:grid-cols-2 md:gap-12 ${i > 0 ? 'md:mt-16' : ''}`}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                >
                  {/* Content */}
                  <div
                    className={`${isEven ? 'md:text-right md:pr-12' : 'md:col-start-2 md:pl-12'}`}
                  >
                    <div className={`ultra-card rounded-2xl p-6 ${isEven ? '' : ''}`}>
                      {/* Step number & icon */}
                      <div
                        className={`flex items-center gap-4 mb-4 ${isEven ? 'md:flex-row-reverse' : ''}`}
                      >
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet to-cyan flex items-center justify-center">
                          <step.icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 uppercase tracking-wider">
                            Phase {i + 1}
                          </span>
                          <h3 className="text-xl font-display font-bold text-white">
                            {step.title}
                          </h3>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-gray-400 mb-4">{step.description}</p>

                      {/* Deliverables */}
                      <div
                        className={`flex flex-wrap gap-2 mb-3 ${isEven ? 'md:justify-end' : ''}`}
                      >
                        {step.deliverables.map((d) => (
                          <span
                            key={d}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-white/5 rounded text-xs text-gray-300"
                          >
                            <Check className="w-3 h-3 text-cyan" />
                            {d}
                          </span>
                        ))}
                      </div>

                      {/* Timeframe */}
                      <p
                        className={`text-xs text-violet font-medium ${isEven ? 'md:text-right' : ''}`}
                      >
                        ⏱ {step.timeframe}
                      </p>
                    </div>
                  </div>

                  {/* Timeline dot - Desktop */}
                  <div className="hidden md:flex absolute left-1/2 top-6 -translate-x-1/2 items-center justify-center">
                    <motion.div
                      className="w-4 h-4 rounded-full bg-gradient-to-br from-violet to-cyan shadow-glow-violet"
                      whileInView={!prefersReducedMotion ? { scale: [0, 1.2, 1] } : undefined}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.15 + 0.2 }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
