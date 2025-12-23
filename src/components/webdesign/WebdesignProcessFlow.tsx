import React, { useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { FileText, CreditCard, Code, CheckCircle } from 'lucide-react';
import { RevealSection } from '../layout/RevealSection';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface ProcessStep {
  number: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const steps: ProcessStep[] = [
  {
    number: '01',
    title: 'Anfrage stellen',
    description: 'Füllen Sie das Formular aus und laden Sie alle benötigten Dateien hoch. Wir sammeln alle Informationen für Ihr Projekt.',
    icon: FileText,
    color: 'text-blue-400',
  },
  {
    number: '02',
    title: 'Anzahlung (100 CHF)',
    description: 'Nach Prüfung Ihrer Anfrage erhalten Sie einen Zahlungslink für die Anzahlung. Sobald diese bezahlt ist, starten wir mit der Umsetzung.',
    icon: CreditCard,
    color: 'text-green-400',
  },
  {
    number: '03',
    title: 'Website-Erstellung',
    description: 'Unser Team erstellt Ihre Website in 2-3 Wochen. Sie erhalten regelmäßige Updates und können Feedback geben.',
    icon: Code,
    color: 'text-purple-400',
  },
  {
    number: '04',
    title: 'Restzahlung (499 CHF) + Übergabe',
    description: 'Nach Ihrer Zustimmung erhalten Sie den Link für die Restzahlung. Danach übergeben wir Ihnen die Login-Daten für Domain und Server.',
    icon: CheckCircle,
    color: 'text-swiss-red',
  },
];

export const WebdesignProcessFlow: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });
  const prefersReducedMotion = useReducedMotion();
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!isInView || prefersReducedMotion) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev < steps.length - 1 ? prev + 1 : 0));
    }, 2000);
    return () => clearInterval(interval);
  }, [isInView, prefersReducedMotion]);

  return (
    <RevealSection id="process-flow" className="py-24 relative section-spacing bg-slate-950/30 overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-swiss-red/20 via-transparent to-swiss-red/20" 
          style={{
            backgroundSize: '200% 100%',
            animation: prefersReducedMotion ? 'none' : 'gradient-mesh 15s ease infinite',
          }}
        />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <RevealSection className="text-center mb-16 max-w-3xl mx-auto" staggerDelay={0.05}>
          <h2 className="text-3xl md:text-5xl font-bold font-display mb-6">
            So funktioniert's – <span className="text-swiss-red">einfach und transparent</span>
          </h2>
          <p className="text-gray-400 text-lg">
            Von der ersten Anfrage bis zur fertigen Website – in 4 klaren Schritten.
          </p>
        </RevealSection>

        <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto relative">
          {/* Progress Line (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 -z-10">
            <motion.div
              className="h-full bg-gradient-to-r from-swiss-red/30 via-swiss-red/50 to-swiss-red/30"
              initial={{ scaleX: 0 }}
              animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
              transition={{ duration: 2, ease: 'easeInOut' }}
              style={{ transformOrigin: 'left' }}
            />
          </div>

          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = activeStep >= index;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                className="relative group"
              >
                {/* Animated Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 z-0 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-swiss-red/50 to-transparent"
                      initial={{ scaleX: 0 }}
                      animate={isInView && isActive ? { scaleX: 1 } : { scaleX: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.2 }}
                      style={{ transformOrigin: 'left' }}
                    />
                  </div>
                )}

                <motion.div
                  className="bg-white/5 border border-white/10 rounded-2xl p-6 h-full relative overflow-hidden backdrop-blur-sm"
                  whileHover={{ 
                    scale: 1.05,
                    borderColor: 'rgba(218, 41, 28, 0.5)',
                    boxShadow: '0 20px 40px rgba(218, 41, 28, 0.2)'
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Shine Effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </div>

                  {/* Step Number with Counter Animation */}
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <motion.span
                      className="text-4xl font-bold text-gray-600 font-mono"
                      animate={isActive ? { color: '#DA291C', scale: 1.1 } : { color: '#4B5563', scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {step.number}
                    </motion.span>
                    <motion.div
                      className={`w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center ${step.color} relative overflow-hidden`}
                      animate={isActive ? { 
                        scale: 1.1,
                        borderColor: 'rgba(218, 41, 28, 0.5)',
                        boxShadow: '0 0 20px rgba(218, 41, 28, 0.3)'
                      } : { scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.div
                        animate={isActive ? { rotate: [0, -10, 10, -10, 0] } : { rotate: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <Icon className="w-6 h-6 relative z-10" />
                      </motion.div>
                      {isActive && (
                        <motion.div
                          className="absolute inset-0 bg-swiss-red/20 rounded-xl"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1.5, opacity: 0 }}
                          transition={{ duration: 0.6 }}
                        />
                      )}
                    </motion.div>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-white mb-3 font-display relative z-10 group-hover:text-swiss-red transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed text-sm relative z-10 group-hover:text-gray-300 transition-colors">
                    {step.description}
                  </p>
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        {/* Total Price Summary with Animation */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 text-center"
        >
          <motion.div
            className="inline-block bg-gradient-to-r from-swiss-red/20 to-red-600/20 border-2 border-swiss-red/30 rounded-2xl px-8 py-6 backdrop-blur-sm relative overflow-hidden"
            whileHover={{ scale: 1.05, borderColor: 'rgba(218, 41, 28, 0.5)' }}
            transition={{ duration: 0.3 }}
          >
            {/* Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000" />
            
            <div className="relative z-10">
              <div className="text-sm text-gray-400 mb-2">Gesamtpreis</div>
              <motion.div
                className="text-4xl font-bold text-white font-display"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: 'spring',
                  stiffness: 200,
                  damping: 15,
                  delay: 0.8
                }}
              >
                599 CHF
              </motion.div>
              <div className="text-sm text-gray-400 mt-2">100 CHF Anzahlung + 499 CHF Restzahlung</div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </RevealSection>
  );
};

