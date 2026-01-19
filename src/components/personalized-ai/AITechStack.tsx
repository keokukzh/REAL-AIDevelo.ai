import React from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  MessageSquare,
  Database,
  Code,
  Zap,
  Shield,
  Globe,
  Cloud,
} from 'lucide-react';
import { ScrollReveal } from '../webdesign/ScrollReveal';

interface Technology {
  name: string;
  description: string;
  icon: React.ElementType;
  category: string;
}

interface AITechStackProps {
  t: {
    techStackTitle: string;
    techStackSub: string;
    technologies: Technology[];
  };
}

export const AITechStack: React.FC<AITechStackProps> = ({ t }) => {
  const categories = Array.from(new Set(t.technologies.map((tech) => tech.category)));

  return (
    <section
      id="tech-stack"
      className="py-24 sm:py-32 bg-slate-950/50 relative overflow-hidden"
      aria-labelledby="tech-stack-heading"
    >
      <div className="container mx-auto px-6 relative z-10">
        <ScrollReveal direction="up" className="text-center mb-16">
          <h2
            id="tech-stack-heading"
            className="text-4xl md:text-6xl font-bold font-display mb-6 tracking-tight"
          >
            {t.techStackTitle}
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto font-light">
            {t.techStackSub}
          </p>
        </ScrollReveal>

        <div className="max-w-6xl mx-auto">
          {categories.map((category, catIndex) => {
            const categoryTechs = t.technologies.filter((tech) => tech.category === category);
            return (
              <div key={category} className="mb-12">
                <ScrollReveal direction="up" delay={catIndex * 0.1}>
                  <h3 className="text-2xl font-bold text-white mb-6 text-center">{category}</h3>
                </ScrollReveal>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryTechs.map((tech, index) => {
                    const Icon = tech.icon;
                    return (
                      <ScrollReveal
                        key={index}
                        direction="up"
                        delay={(catIndex * 0.1 + index * 0.05)}
                      >
                        <motion.div
                          whileHover={{ y: -4 }}
                          className="p-6 rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-white/5 hover:border-white/20 transition-all group"
                        >
                          <div className="p-3 w-fit rounded-xl bg-white/5 border border-white/10 group-hover:bg-swiss-red/10 group-hover:border-swiss-red/20 transition-colors mb-4">
                            <Icon className="w-6 h-6 text-swiss-red" />
                          </div>
                          <h4 className="text-lg font-bold text-white mb-2">{tech.name}</h4>
                          <p className="text-gray-400 text-sm leading-relaxed font-light">
                            {tech.description}
                          </p>
                        </motion.div>
                      </ScrollReveal>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
