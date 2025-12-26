import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { Check, ArrowRight, Star } from 'lucide-react';

const pricingTiers = [
  {
    name: 'Launch',
    subtitle: 'Für den schnellen Start',
    price: 'ab 2.900€',
    description: 'Perfekt für Startups und kleine Teams, die schnell online gehen wollen.',
    features: [
      'Landing Page oder One-Pager',
      'Mobile-first Design',
      'Basic SEO Setup',
      'Kontaktformular + Lead-Tracking',
      '2 Revisionsrunden',
    ],
    cta: 'Launch starten',
    highlighted: false,
    color: 'violet',
    fit: 'Ideal für: MVPs, Side-Projects, Personal Brands',
  },
  {
    name: 'Scale',
    subtitle: 'Für wachsende Businesses',
    price: 'ab 7.500€',
    description: 'Vollständige Web-Präsenz oder Voice Agent mit allen Integrationen.',
    features: [
      'Multi-Page Website oder Voice Agent',
      'Custom Design System',
      'Advanced SEO & Analytics',
      'CRM/Kalender-Integration',
      'A/B Testing Setup',
      'Priority Support (48h)',
    ],
    cta: 'Scale anfragen',
    highlighted: true,
    color: 'cyan',
    fit: 'Ideal für: KMUs, Agencies, wachsende Teams',
  },
  {
    name: 'Enterprise',
    subtitle: 'Für komplexe Anforderungen',
    price: 'Auf Anfrage',
    description: 'Maßgeschneiderte Lösungen mit langfristiger Partnerschaft.',
    features: [
      'Komplette Digital-Strategie',
      'Web + Voice Agent Kombi',
      'Custom Integrations',
      'Dedicated Account Manager',
      'SLA & Uptime Garantie',
      '24/7 Support',
    ],
    cta: 'Enterprise Call buchen',
    highlighted: false,
    color: 'electric-blue',
    fit: 'Ideal für: Scale-ups, Corporates, Multi-Location',
  },
];

export const PricingCards: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();

  const scrollToContact = () => {
    const contactSection = document.querySelector('#contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }
  };

  return (
    <section id="pricing" className="py-20 md:py-32 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-glow-cyan opacity-20 pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Section header */}
        <div className="text-center mb-12 md:mb-16">
          <motion.span
            className="text-xs font-bold tracking-widest uppercase text-violet mb-4 block"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Pricing
          </motion.span>
          <motion.h2
            className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Klare Preise, klarer Scope
          </motion.h2>
          <motion.p
            className="text-gray-400 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Keine versteckten Kosten. Keine Überraschungen. Du weißt immer, was du bekommst.
          </motion.p>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {pricingTiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              className={`relative rounded-2xl overflow-hidden ${
                tier.highlighted ? 'md:-mt-4 md:mb-4' : ''
              }`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              {/* Gradient border for highlighted */}
              {tier.highlighted && (
                <div className="absolute inset-0 bg-gradient-to-br from-violet via-cyan to-electric-blue p-px rounded-2xl">
                  <div className="absolute inset-px bg-obsidian rounded-2xl" />
                </div>
              )}

              <div
                className={`relative h-full p-6 lg:p-8 ${tier.highlighted ? '' : 'ultra-card'} rounded-2xl flex flex-col`}
              >
                {/* Popular badge */}
                {tier.highlighted && (
                  <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-violet to-cyan rounded-full text-xs font-bold text-obsidian">
                    <Star className="w-3 h-3" />
                    Beliebt
                  </div>
                )}

                {/* Header */}
                <div className="mb-6">
                  <span
                    className={`text-xs font-bold tracking-widest uppercase ${
                      tier.color === 'violet'
                        ? 'text-violet'
                        : tier.color === 'cyan'
                          ? 'text-cyan'
                          : 'text-electric-blue'
                    }`}
                  >
                    {tier.subtitle}
                  </span>
                  <h3 className="text-2xl font-display font-bold text-white mt-1">{tier.name}</h3>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <span className="text-3xl lg:text-4xl font-display font-bold text-white">
                    {tier.price}
                  </span>
                </div>

                {/* Description */}
                <p className="text-gray-400 text-sm mb-6">{tier.description}</p>

                {/* Features */}
                <ul className="space-y-3 mb-6 flex-grow">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <Check
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          tier.color === 'violet'
                            ? 'text-violet'
                            : tier.color === 'cyan'
                              ? 'text-cyan'
                              : 'text-electric-blue'
                        }`}
                      />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Fit description */}
                <p className="text-xs text-gray-500 mb-6 italic">{tier.fit}</p>

                {/* CTA */}
                <button
                  onClick={scrollToContact}
                  className={`group w-full py-4 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ultra-btn-sheen ultra-focus ${
                    tier.highlighted
                      ? 'bg-gradient-to-r from-violet to-cyan text-obsidian hover:shadow-glow-ultra'
                      : 'bg-white/5 text-white border border-white/10 hover:border-white/30 hover:bg-white/10'
                  }`}
                >
                  {tier.cta}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Guarantee */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-sm text-gray-500">
            💰 Kostenlose Erstberatung • 🤝 Flexible Zahlungsoptionen • ✨ Zufriedenheitsgarantie
          </p>
        </motion.div>
      </div>
    </section>
  );
};
