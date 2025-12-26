import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { ArrowUpRight, TrendingUp, Users, Clock, Target } from 'lucide-react';

const showcaseItems = [
  {
    title: 'E-Commerce Relaunch',
    category: 'Webdesign',
    color: 'violet',
    results: [
      { icon: TrendingUp, label: 'Mehr Conversions', value: '+47%' },
      { icon: Clock, label: 'Ladezeit', value: '<2s' },
    ],
  },
  {
    title: 'Inbound Voice Agent',
    category: 'Voice AI',
    color: 'cyan',
    results: [
      { icon: Users, label: 'Anrufe handled', value: '24/7' },
      { icon: Target, label: 'Lead-Qualifikation', value: '89%' },
    ],
  },
  {
    title: 'SaaS Landing Page',
    category: 'Webdesign',
    color: 'violet',
    results: [
      { icon: TrendingUp, label: 'Sign-ups', value: '+124%' },
      { icon: Clock, label: 'Time-to-Demo', value: '-3 Tage' },
    ],
  },
  {
    title: 'Appointment Setter',
    category: 'Voice AI',
    color: 'cyan',
    results: [
      { icon: Users, label: 'Termine/Woche', value: '+45' },
      { icon: Target, label: 'No-Shows', value: '-62%' },
    ],
  },
  {
    title: 'Corporate Redesign',
    category: 'Webdesign',
    color: 'electric-blue',
    results: [
      { icon: TrendingUp, label: 'Engagement', value: '+89%' },
      { icon: Clock, label: 'Bounce Rate', value: '-41%' },
    ],
  },
  {
    title: 'Outbound Qualifier',
    category: 'Voice AI',
    color: 'cyan',
    results: [
      { icon: Users, label: 'Leads qualifiziert', value: '+200%' },
      { icon: Target, label: 'Sales Meetings', value: '+78%' },
    ],
  },
];

interface ShowcaseCardProps {
  item: (typeof showcaseItems)[0];
  index: number;
}

const ShowcaseCard: React.FC<ShowcaseCardProps> = ({ item, index }) => {
  const prefersReducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15 });

  const rotateX = useTransform(mouseY, [-0.5, 0.5], [5, -5]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-5, 5]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    x.set((e.clientX - centerX) / rect.width);
    y.set((e.clientY - centerY) / rect.height);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const colorClasses = {
    violet: { bg: 'bg-violet/10', border: 'border-violet/30', text: 'text-violet' },
    cyan: { bg: 'bg-cyan/10', border: 'border-cyan/30', text: 'text-cyan' },
    'electric-blue': {
      bg: 'bg-electric-blue/10',
      border: 'border-electric-blue/30',
      text: 'text-electric-blue',
    },
  };

  const colors = colorClasses[item.color as keyof typeof colorClasses] || colorClasses.violet;

  return (
    <motion.div
      ref={cardRef}
      className="group relative"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={
        !prefersReducedMotion
          ? {
              rotateX,
              rotateY,
              transformStyle: 'preserve-3d',
            }
          : undefined
      }
    >
      <div
        className={`ultra-card rounded-2xl p-6 h-full transition-all duration-300 group-hover:${colors.border}`}
      >
        {/* Category badge */}
        <div
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${colors.bg} ${colors.text} text-xs font-medium mb-4`}
        >
          {item.category}
        </div>

        {/* Title */}
        <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center justify-between">
          {item.title}
          <ArrowUpRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
        </h3>

        {/* Results */}
        <div className="space-y-3">
          {item.results.map((result, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <result.icon className={`w-4 h-4 ${colors.text}`} />
                {result.label}
              </div>
              <span className={`font-bold ${colors.text}`}>{result.value}</span>
            </div>
          ))}
        </div>

        {/* Hover glow */}
        <div
          className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`}
          style={{
            background:
              item.color === 'cyan'
                ? 'radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(34,211,238,0.1) 0%, transparent 50%)'
                : 'radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(124,58,237,0.1) 0%, transparent 50%)',
          }}
        />
      </div>
    </motion.div>
  );
};

export const ShowcaseGrid: React.FC = () => {
  return (
    <section id="work" className="py-20 md:py-32 relative">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Section header */}
        <div className="text-center mb-12 md:mb-16">
          <motion.span
            className="text-xs font-bold tracking-widest uppercase text-cyan mb-4 block"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Case Studies
          </motion.span>
          <motion.h2
            className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Typische Ergebnisse
          </motion.h2>
          <motion.p
            className="text-gray-400 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Was unsere Kunden mit AIDevelo erreichen – messbar, nachvollziehbar, reproduzierbar.
          </motion.p>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {showcaseItems.map((item, i) => (
            <ShowcaseCard key={item.title} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};
