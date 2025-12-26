import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

// Tech stack items - all as text/SVG, no external images
const stackItems = [
  // Frontend
  { name: 'React', category: 'Frontend', color: '#61DAFB' },
  { name: 'Next.js', category: 'Frontend', color: '#FFFFFF' },
  { name: 'Vite', category: 'Frontend', color: '#646CFF' },
  { name: 'TypeScript', category: 'Frontend', color: '#3178C6' },
  { name: 'Tailwind CSS', category: 'Frontend', color: '#06B6D4' },
  { name: 'Framer Motion', category: 'Frontend', color: '#FF0055' },
  // Backend
  { name: 'Node.js', category: 'Backend', color: '#339933' },
  { name: 'Express', category: 'Backend', color: '#FFFFFF' },
  { name: 'PostgreSQL', category: 'Backend', color: '#4169E1' },
  { name: 'Redis', category: 'Backend', color: '#DC382D' },
  // AI/Voice
  { name: 'OpenAI', category: 'AI/Voice', color: '#00A67E' },
  { name: 'ElevenLabs', category: 'AI/Voice', color: '#FFFFFF' },
  { name: 'Twilio', category: 'AI/Voice', color: '#F22F46' },
  // Integrations
  { name: 'Stripe', category: 'Integrations', color: '#635BFF' },
  { name: 'Supabase', category: 'Integrations', color: '#3FCF8E' },
  { name: 'Vercel', category: 'Integrations', color: '#FFFFFF' },
];

const categories = ['Frontend', 'Backend', 'AI/Voice', 'Integrations'];

export const StackGrid: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section id="stack" className="py-20 md:py-32 relative bg-panel/30">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Section header */}
        <div className="text-center mb-12 md:mb-16">
          <motion.span
            className="text-xs font-bold tracking-widest uppercase text-cyan mb-4 block"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Tech Stack
          </motion.span>
          <motion.h2
            className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Moderne Werkzeuge
          </motion.h2>
          <motion.p
            className="text-gray-400 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Enterprise-grade Tech, pragmatisch eingesetzt. Keine Experimente auf deinem Rücken.
          </motion.p>
        </div>

        {/* Stack by category */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, catIndex) => (
            <motion.div
              key={category}
              className="space-y-3"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: catIndex * 0.1 }}
            >
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                {category}
              </h3>

              {stackItems
                .filter((item) => item.category === category)
                .map((item, i) => (
                  <motion.div
                    key={item.name}
                    className="group flex items-center gap-3 p-3 ultra-card rounded-lg hover:border-white/20 transition-all cursor-default"
                    whileHover={!prefersReducedMotion ? { x: 4 } : undefined}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: catIndex * 0.1 + i * 0.05 }}
                  >
                    {/* Color dot */}
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                      {item.name}
                    </span>
                  </motion.div>
                ))}
            </motion.div>
          ))}
        </div>

        {/* Security note */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-sm text-gray-500">
            🔒 Env-basierte Konfiguration • Least Privilege Principle • DSGVO-konform
          </p>
        </motion.div>
      </div>
    </section>
  );
};
