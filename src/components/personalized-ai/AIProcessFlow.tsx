import React, { useRef } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Search, Lightbulb, Code, Plug, HeadphonesIcon } from 'lucide-react';
import { RevealSection } from '../layout/RevealSection';

interface AIProcessFlowProps {
  t: {
    processTitle: string;
    processSub: string;
    steps: Array<{
      number: string;
      title: string;
      description: string;
    }>;
  };
}

export const AIProcessFlow: React.FC<AIProcessFlowProps> = ({ t }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const stepsData = t.steps.map((s, i) => ({
    ...s,
    icon: [Search, Lightbulb, Code, Plug, Headphones][i],
    color: [
      'text-blue-400',
      'text-amber-400',
      'text-emerald-400',
      'text-purple-400',
      'text-swiss-red',
    ][i],
  }));

  return (
    <section
      ref={containerRef}
      className="py-24 sm:py-32 bg-slate-950/50 relative overflow-hidden"
      aria-labelledby="process-heading"
    >
      <div className="container mx-auto px-6 relative z-10">
        <RevealSection className="text-center mb-16 max-w-3xl mx-auto">
          <h2
            id="process-heading"
            className="text-4xl md:text-6xl font-bold font-display mb-6 tracking-tight"
          >
            {t.processTitle}
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto font-light">{t.processSub}</p>
        </RevealSection>

        {/* Process Timeline */}
        <div className="relative max-w-5xl mx-auto">
          {/* Progress Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-white/10 hidden md:block">
            <motion.div
              className="absolute top-0 left-0 w-full bg-gradient-to-b from-swiss-red to-purple-500 origin-top"
              style={{ scaleY: progress }}
            />
          </div>

          {/* Steps */}
          <div className="space-y-16 md:space-y-24">
            {stepsData.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="relative flex flex-col md:flex-row items-start gap-8"
                >
                  {/* Icon Circle */}
                  <div className="relative z-10 flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-slate-900/80 backdrop-blur-xl border-2 border-white/10 flex items-center justify-center group-hover:border-swiss-red/50 transition-colors">
                      <Icon className={`w-8 h-8 ${step.color}`} />
                    </div>
                    <div className="absolute -inset-2 rounded-full bg-swiss-red/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-2">
                    <div className="flex items-center gap-4 mb-3">
                      <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">
                        {step.number}
                      </span>
                      <h3 className="text-2xl md:text-3xl font-bold text-white">{step.title}</h3>
                    </div>
                    <p className="text-gray-400 text-lg leading-relaxed font-light">
                      {step.description}
                    </p>
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
