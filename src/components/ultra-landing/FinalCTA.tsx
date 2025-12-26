import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { ContactForm } from './ContactForm';
import { Sparkles, Mail, Phone, MapPin } from 'lucide-react';

export const FinalCTA: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section id="contact" className="py-20 md:py-32 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-30" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-glow-violet opacity-20 pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Left: Headline + Contact Info */}
            <div>
              <motion.div
                className="mb-8"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <span className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-violet mb-4">
                  <Sparkles className="w-4 h-4" />
                  Let's Talk
                </span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-4 leading-tight">
                  Bereit für <span className="ultra-gradient-text">echte Ergebnisse?</span>
                </h2>
                <p className="text-lg text-gray-400 leading-relaxed">
                  Erzähl uns von deinem Projekt. Wir melden uns innerhalb von 24 Stunden mit einer
                  kostenlosen Ersteinschätzung.
                </p>
              </motion.div>

              {/* Contact info cards */}
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <a
                  href="mailto:hello@aidevelo.ai"
                  className="group flex items-center gap-4 p-4 ultra-card rounded-xl hover:border-violet/30 transition-all ultra-focus"
                >
                  <div className="w-12 h-12 rounded-lg bg-violet/10 flex items-center justify-center group-hover:bg-violet/20 transition-colors">
                    <Mail className="w-5 h-5 text-violet" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">E-Mail</p>
                    <p className="text-white font-medium">hello@aidevelo.ai</p>
                  </div>
                </a>

                <a
                  href="tel:+41000000000"
                  className="group flex items-center gap-4 p-4 ultra-card rounded-xl hover:border-cyan/30 transition-all ultra-focus"
                >
                  <div className="w-12 h-12 rounded-lg bg-cyan/10 flex items-center justify-center group-hover:bg-cyan/20 transition-colors">
                    <Phone className="w-5 h-5 text-cyan" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Telefon</p>
                    <p className="text-white font-medium">Auf Anfrage</p>
                  </div>
                </a>

                <div className="flex items-center gap-4 p-4 ultra-card rounded-xl">
                  <div className="w-12 h-12 rounded-lg bg-electric-blue/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-electric-blue" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Standort</p>
                    <p className="text-white font-medium">DACH Region • Remote-First</p>
                  </div>
                </div>
              </motion.div>

              {/* Trust indicators */}
              <motion.div
                className="mt-8 flex flex-wrap gap-4"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Antwort in 24h
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Kostenlos & unverbindlich
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Kein Spam, versprochen
                </div>
              </motion.div>
            </div>

            {/* Right: Form */}
            <motion.div
              className="ultra-card rounded-2xl p-6 md:p-8"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={!prefersReducedMotion ? { delay: 0.2, duration: 0.6 } : undefined}
            >
              <ContactForm />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
