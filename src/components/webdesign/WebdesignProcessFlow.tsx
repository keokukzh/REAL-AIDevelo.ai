import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useSpring, useInView } from 'framer-motion';
import { FileText, CreditCard, Code, CheckCircle, Search, ArrowRight } from 'lucide-react';
import { RevealSection } from '../layout/RevealSection';
import { BlurText } from './BlurText';
import { HorizontalScrollTimeline } from './HorizontalScrollTimeline';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { SplitText } from './react-bits';

const PROCESS_DICTIONARY = {
  de: {
    workflow: 'Workflow',
    title: 'In 5 Schritten zur',
    titleHighlight: 'neuen Website',
    sub: 'Ein strukturierter Prozess für erstklassige Resultate. Von der Idee bis zum Launch – transparent und effizient.',
    steps: [
      {
        number: '01',
        title: 'Kostenlose Erstberatung',
        description:
          'Wir besprechen Ihre Ziele und Anforderungen in einem unverbindlichen Gespräch (Zoom oder Telefon).',
      },
      {
        number: '02',
        title: 'Konzept & Analyse',
        description:
          'Wir analysieren Ihre Zielgruppe und erstellen ein massgeschneidertes Angebot zum Festpreis.',
      },
      {
        number: '03',
        title: 'Design-Phase (100 CHF)',
        description:
          'Nach Startschuss erstellen wir das visuelle Konzept. Wir sichern Domain & Hosting und legen das Fundament.',
      },
      {
        number: '04',
        title: 'Entwicklung & Feedback',
        description:
          'Wir verwandeln das Design in schnellen Code. Sie erhalten Zugriff auf die Live-Vorschau und geben Feedback.',
      },
      {
        number: '05',
        title: 'Launch & Erfolg',
        description:
          'Nach Abnahme und Restzahlung geht Ihre Website live. Wir übergeben alle Zugänge und schulen Sie kurz ein.',
      },
    ],
  },
  en: {
    workflow: 'Workflow',
    title: '5 Steps to your',
    titleHighlight: 'new Website',
    sub: 'A structured process for top-tier results. From idea to launch – transparent and efficient.',
    steps: [
      {
        number: '01',
        title: 'Free Consultation',
        description:
          'We discuss your goals and requirements in a non-binding conversation (Zoom or Phone).',
      },
      {
        number: '02',
        title: 'Concept & Analysis',
        description:
          'We analyze your target audience and create a tailor-made offer at a fixed price.',
      },
      {
        number: '03',
        title: 'Design Phase (100 CHF)',
        description:
          'After the go-ahead, we create the visual concept. We secure domain & hosting and lay the foundation.',
      },
      {
        number: '04',
        title: 'Development & Feedback',
        description:
          'We transform the design into fast code. You get access to the live preview and provide feedback.',
      },
      {
        number: '05',
        title: 'Launch & Success',
        description:
          'After approval and final payment, your website goes live. We hand over all access and provide a brief training.',
      },
    ],
  },
};

export const WebdesignProcessFlow: React.FC<{ lang?: 'de' | 'en' }> = ({ lang = 'de' }) => {
  const t = PROCESS_DICTIONARY[lang];
  const prefersReducedMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const stepsData = t.steps.map((s, i) => ({
    ...s,
    icon: [FileText, Search, CreditCard, Code, CheckCircle][i],
    color: [
      'text-blue-400',
      'text-amber-400',
      'text-emerald-400',
      'text-purple-400',
      'text-swiss-red',
    ][i],
    bgColor: [
      'bg-blue-500/10',
      'bg-amber-500/10',
      'bg-emerald-500/10',
      'bg-purple-500/10',
      'bg-swiss-red/10',
    ][i],
    borderColor: [
      'border-blue-500/20',
      'border-amber-500/20',
      'border-emerald-500/20',
      'border-purple-500/20',
      'border-swiss-red/20',
    ][i],
  }));

  // Detect mobile for fallback
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const scaleY = useSpring(scrollYProgress, {
    stiffness: prefersReducedMotion ? 1000 : 100,
    damping: prefersReducedMotion ? 100 : 30,
    restDelta: 0.001,
  });

  return (
    <section
      ref={containerRef}
      id="process-flow"
      className="py-24 sm:py-32 relative overflow-hidden scroll-mt-20"
      aria-labelledby="process-flow-heading"
    >
      {/* Background Circuit Grid */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      {/* Ambient Glows */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-swiss-red/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-20">
        <RevealSection className="text-center mb-24 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-1.5 rounded-full bg-swiss-red/10 border border-swiss-red/20 text-swiss-red text-sm font-bold uppercase tracking-widest mb-6"
          >
            {t.workflow}
          </motion.div>
          <div className="mb-6">
            <BlurText
              text={`${t.title} ${t.titleHighlight}`}
              animateBy="words"
              direction="top"
              delay={100}
              stepDuration={0.3}
              className="text-3xl md:text-5xl font-bold font-display leading-tight"
            />
          </div>
          <p className="text-gray-400 text-lg leading-relaxed">{t.sub}</p>
        </RevealSection>

        {/* Mobile: Vertical Timeline Fallback */}
        {isMobile ? (
          <div className="relative max-w-5xl mx-auto">
            <div className="absolute left-8 top-0 bottom-0 w-1 bg-white/5 rounded-full" aria-hidden="true">
              <motion.div
                style={prefersReducedMotion ? {} : { scaleY, transformOrigin: 'top' }}
                className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-swiss-red via-purple-500 to-blue-500 rounded-full"
              />
            </div>
            <div className="space-y-12 pl-16">
              {stepsData.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -30 }}
                  whileInView={prefersReducedMotion ? {} : { opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="relative"
                >
                  <div className="absolute -left-12 top-0 w-8 h-8 bg-slate-950 border-2 border-white/30 rounded-full flex items-center justify-center z-10">
                    <div className={`w-4 h-4 ${step.bgColor.replace('bg-', 'bg-').replace('/10', '/30')} rounded-full`} />
                  </div>
                  <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 p-6 rounded-2xl">
                    <div className="flex items-start gap-4 mb-4">
                      <span className={`text-4xl font-bold font-display opacity-20 ${step.color}`}>
                        {step.number}
                      </span>
                      <div className={`p-3 rounded-lg bg-white/5 border border-white/10 ${step.color}`}>
                        {React.createElement(step.icon, { size: 20 } as React.ComponentProps<'svg'>)}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      <SplitText splitBy="words" delay={30}>{step.title}</SplitText>
                    </h3>
                    <p className="text-gray-400 leading-relaxed font-light text-sm">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          /* Desktop: Horizontal Scroll Timeline */
          <div className="relative">
            <HorizontalScrollTimeline
              showScrollCue={true}
              snapType="mandatory"
              className="max-w-full"
            >
              {stepsData.map((step, index) => (
                <ProcessStepCard
                  key={step.number}
                  step={step}
                  index={index}
                  totalSteps={stepsData.length}
                  prefersReducedMotion={prefersReducedMotion}
                />
              ))}
            </HorizontalScrollTimeline>
          </div>
        )}

        {/* Pricing Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-24 sm:mt-32 relative max-w-4xl mx-auto"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-swiss-red/20 via-purple-500/20 to-blue-500/20 blur-3xl opacity-30" />
          <div className="relative bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 md:p-12 overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-swiss-red via-purple-500 to-blue-500" />

            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <div className="text-sm font-medium text-gray-500 uppercase tracking-widest mb-1">
                  {t.pricingTitle}
                </div>
                <div className="text-5xl font-bold font-display text-white mb-2">
                  599 <span className="text-2xl text-gray-400">CHF</span>
                </div>
                <p className="text-gray-400">{t.pricingSub}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// Separate component to avoid hooks in callback
interface ProcessStepCardProps {
  step: {
    number: string;
    title: string;
    description: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    borderColor: string;
  };
  index: number;
  totalSteps: number;
  prefersReducedMotion: boolean;
}

const ProcessStepCard: React.FC<ProcessStepCardProps> = ({ step, index, totalSteps, prefersReducedMotion }) => {
  const stepRef = useRef<HTMLDivElement>(null);
  const isInViewStep = useInView(stepRef, { once: true, amount: 0.5 });

  return (
    <motion.div
      ref={stepRef}
      initial={prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
      animate={isInViewStep ? { opacity: 1, scale: 1 } : { opacity: 0.7, scale: 0.95 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      whileHover={prefersReducedMotion ? {} : { y: -6, scale: 1.02 }}
      className="group relative w-[380px] md:w-[420px] flex-shrink-0"
    >
      {/* Progress Indicator */}
      <div className="absolute -top-2 left-0 right-0 h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${step.bgColor.replace('bg-', 'bg-gradient-to-r').replace('/10', '')} rounded-full`}
          initial={{ width: 0 }}
          animate={isInViewStep ? { width: '100%' } : { width: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      <div className={`absolute inset-0 ${step.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl blur-xl`} />
      <div className="relative bg-slate-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-3xl hover:border-white/30 transition-all duration-300 h-full">
        {/* Step Number & Icon */}
        <div className="flex items-start gap-4 mb-6">
          <span className={`text-6xl font-bold font-display opacity-20 ${step.color}`}>
            {step.number}
          </span>
          <div className={`p-4 rounded-xl ${step.bgColor} ${step.borderColor} border group-hover:scale-110 transition-transform duration-300`}>
            {React.createElement(step.icon, { size: 28, className: step.color } as React.ComponentProps<'svg'>)}
          </div>
        </div>

        <h3 className={`text-2xl font-bold mb-4 ${step.color} group-hover:text-white transition-colors`}>
          <SplitText splitBy="words" delay={30}>{step.title}</SplitText>
        </h3>
        <p className="text-gray-400 leading-relaxed font-light mb-6">
          {step.description}
        </p>

        {/* Arrow Indicator */}
        {index < totalSteps - 1 && (
          <div className="absolute -right-6 top-1/2 -translate-y-1/2 text-white/20">
            <ArrowRight size={24} />
          </div>
        )}
      </div>
    </motion.div>
  );
};
