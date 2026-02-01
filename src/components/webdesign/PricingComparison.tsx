import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, X, AlertCircle } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { AnimatedContent } from './react-bits';

interface PricingComparisonProps {
  lang?: 'de' | 'en';
}

const COMPARISON_DATA = {
  de: {
    title: 'Vergleich: Was Sie wirklich zahlen',
    subtitle: 'Transparenz ist wichtig – sehen Sie den echten Vergleich',
    aidevelo: 'AIDevelo',
    agency: 'Agentur',
    template: 'Baukasten (Wix/WordPress)',
    initial: 'Anfangsinvestition',
    maintenance: 'Monatliche Wartung',
    updates: 'Updates/Erweiterungen',
    support: 'Persönlicher Support',
    total: 'Gesamtkosten (1 Jahr)',
    note: '* Erste 3 Monate Wartung inklusive, danach optional',
    features: {
      initial: {
        aidevelo: 'CHF 599',
        agency: 'CHF 2,000-5,000',
        template: 'CHF 0-200',
      },
      maintenance: {
        aidevelo: 'CHF 0*',
        agency: 'CHF 100-300/Monat',
        template: 'CHF 20-50/Monat',
      },
      updates: {
        aidevelo: '✓ Inklusive',
        agency: 'CHF 150-300/Stunde',
        template: 'Begrenzt möglich',
      },
      support: {
        aidevelo: '✓ Persönlich',
        agency: '✓ Persönlich',
        template: '✗ Community/Forum',
      },
      total: {
        aidevelo: 'CHF 599',
        agency: 'CHF 3,200-8,600',
        template: 'CHF 240-800',
      },
    },
  },
  en: {
    title: 'Comparison: What You Really Pay',
    subtitle: 'Transparency matters – see the real comparison',
    aidevelo: 'AIDevelo',
    agency: 'Agency',
    template: 'Template Builder (Wix/WordPress)',
    initial: 'Initial Investment',
    maintenance: 'Monthly Maintenance',
    updates: 'Updates/Extensions',
    support: 'Personal Support',
    total: 'Total Cost (1 Year)',
    note: '* First 3 months maintenance included, then optional',
    features: {
      initial: {
        aidevelo: 'CHF 599',
        agency: 'CHF 2,000-5,000',
        template: 'CHF 0-200',
      },
      maintenance: {
        aidevelo: 'CHF 0*',
        agency: 'CHF 100-300/Month',
        template: 'CHF 20-50/Month',
      },
      updates: {
        aidevelo: '✓ Included',
        agency: 'CHF 150-300/Hour',
        template: 'Limited',
      },
      support: {
        aidevelo: '✓ Personal',
        agency: '✓ Personal',
        template: '✗ Community/Forum',
      },
      total: {
        aidevelo: 'CHF 599',
        agency: 'CHF 3,200-8,600',
        template: 'CHF 240-800',
      },
    },
  },
};

export const PricingComparison: React.FC<PricingComparisonProps> = ({ lang = 'de' }) => {
  const t = COMPARISON_DATA[lang];
  const prefersReducedMotion = useReducedMotion();

  const rows = [
    { key: 'initial', label: t.initial },
    { key: 'maintenance', label: t.maintenance },
    { key: 'updates', label: t.updates },
    { key: 'support', label: t.support },
    { key: 'total', label: t.total, isTotal: true },
  ];

  return (
    <section className="py-16 sm:py-24 md:py-32 relative overflow-hidden bg-slate-900/20">
      <div className="container mx-auto px-4 sm:px-6">
        <AnimatedContent direction="up" className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display mb-4 tracking-tight text-white">
              {t.title}
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">{t.subtitle}</p>
          </div>

          <div className="overflow-x-auto">
            <motion.table
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="w-full border-collapse bg-slate-900/40 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10"
            >
              <thead>
                <tr className="border-b border-white/20">
                  <th className="p-4 sm:p-6 text-left text-sm sm:text-base font-semibold text-gray-300">
                    {lang === 'de' ? 'Leistung' : 'Feature'}
                  </th>
                  <th className="p-4 sm:p-6 text-center bg-swiss-red/10 border-l border-white/10">
                    <div className="font-bold text-white text-lg">{t.aidevelo}</div>
                    <div className="text-xs text-emerald-400 mt-1">{lang === 'de' ? 'Empfohlen' : 'Recommended'}</div>
                  </th>
                  <th className="p-4 sm:p-6 text-center border-l border-white/10">
                    <div className="font-semibold text-gray-300">{t.agency}</div>
                  </th>
                  <th className="p-4 sm:p-6 text-center border-l border-white/10">
                    <div className="font-semibold text-gray-300">{t.template}</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const isTotal = row.isTotal;
                  const featureData = t.features[row.key as keyof typeof t.features];
                  const aideveloValue = featureData?.aidevelo || '';
                  const agencyValue = featureData?.agency || '';
                  const templateValue = featureData?.template || '';

                  return (
                    <motion.tr
                      key={row.key}
                      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
                      whileInView={prefersReducedMotion ? {} : { opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className={`border-b border-white/10 hover:bg-white/5 transition-colors ${
                        isTotal ? 'bg-slate-900/60 font-bold' : ''
                      }`}
                    >
                      <td className={`p-4 sm:p-6 text-sm sm:text-base ${isTotal ? 'text-white' : 'text-gray-300'}`}>
                        {row.label}
                      </td>
                      <td className={`p-4 sm:p-6 text-center border-l border-white/10 ${
                        isTotal ? 'text-emerald-400 text-xl' : 'text-white'
                      }`}>
                        {aideveloValue.includes('✓') ? (
                          <div className="flex items-center justify-center gap-2">
                            <CheckCircle2 size={18} className="text-emerald-400" />
                            <span className="text-emerald-400">{aideveloValue.replace('✓ ', '')}</span>
                          </div>
                        ) : (
                          <span className={isTotal ? 'text-emerald-400 font-bold' : ''}>{aideveloValue}</span>
                        )}
                      </td>
                      <td className="p-4 sm:p-6 text-center border-l border-white/10 text-gray-400">
                        {agencyValue.includes('✓') ? (
                          <div className="flex items-center justify-center gap-2">
                            <CheckCircle2 size={18} className="text-gray-500" />
                            <span>{agencyValue.replace('✓ ', '')}</span>
                          </div>
                        ) : agencyValue.includes('✗') ? (
                          <div className="flex items-center justify-center gap-2">
                            <X size={18} className="text-red-400" />
                            <span>{agencyValue.replace('✗ ', '')}</span>
                          </div>
                        ) : (
                          <span>{agencyValue}</span>
                        )}
                      </td>
                      <td className="p-4 sm:p-6 text-center border-l border-white/10 text-gray-400">
                        {templateValue.includes('✓') ? (
                          <div className="flex items-center justify-center gap-2">
                            <CheckCircle2 size={18} className="text-gray-500" />
                            <span>{templateValue.replace('✓ ', '')}</span>
                          </div>
                        ) : templateValue.includes('✗') ? (
                          <div className="flex items-center justify-center gap-2">
                            <X size={18} className="text-red-400" />
                            <span>{templateValue.replace('✗ ', '')}</span>
                          </div>
                        ) : (
                          <span>{templateValue}</span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </motion.table>
          </div>

          <motion.p
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
            whileInView={prefersReducedMotion ? {} : { opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="text-sm text-gray-400 mt-6 text-center"
          >
            {t.note}
          </motion.p>
        </AnimatedContent>
      </div>
    </section>
  );
};
