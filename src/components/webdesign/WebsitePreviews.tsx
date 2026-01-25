import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { Magnetic } from './Magnetic';
import { Button } from '../ui/Button';
import { ScrollCue } from './ScrollCue';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface PreviewItem {
  id: string;
  title: string;
  category: string;
  image: string;
  description: string;
  tags: string[];
}

// Separate component for portfolio card to use hooks
const PortfolioCard: React.FC<{
  item: PreviewItem;
  index: number;
  prefersReducedMotion: boolean;
}> = ({ item, index, prefersReducedMotion }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const isInViewCard = useInView(cardRef, { once: true, amount: 0.3 });

  return (
    <motion.div
      ref={cardRef}
      initial={prefersReducedMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
      animate={isInViewCard ? { opacity: 1, x: 0 } : { opacity: 0.5, x: 30 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      whileHover={prefersReducedMotion ? {} : { y: -8, scale: 1.02 }}
      className="relative aspect-[16/10] group rounded-3xl overflow-hidden border border-white/10 bg-slate-900 shadow-2xl flex-shrink-0 w-[90vw] md:w-[500px] lg:w-[600px]"
      style={{ scrollSnapAlign: 'start' }}
    >
      {/* Video Preview - Animated Website */}
      <div className="relative w-full h-full overflow-hidden bg-slate-900">
        <video
          src={`https://api.screenshotone.com/animate?access_key=demo&url=${encodeURIComponent(item.image)}&viewport_width=1920&viewport_height=1080&format=mp4&video_duration=10&fps=30`}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          title={`Video preview of ${item.title}`}
          onError={(e) => {
            // Fallback to iframe if video fails
            const video = e.target as HTMLVideoElement;
            const container = video.parentElement;
            if (container) {
              container.innerHTML = `
                <iframe
                  src="${item.image}"
                  class="absolute inset-0 w-full h-full"
                  style="transform: scale(0.67); transform-origin: top left; width: 150%; height: 150%;"
                  title="Live preview of ${item.title}"
                  sandbox="allow-same-origin allow-scripts allow-popups"
                  loading="lazy"
                ></iframe>
                <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent pointer-events-none"></div>
              `;
            }
          }}
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent pointer-events-none" />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
        <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
          <span className="inline-block px-3 py-1 bg-swiss-red/20 text-swiss-red text-xs font-bold rounded-full mb-2 border border-swiss-red/20 uppercase tracking-widest">
            {item.category}
          </span>
          <h3 className="text-2xl font-bold text-white mb-2">{item.title}</h3>
          <p className="text-gray-300 text-sm line-clamp-2 mb-3 font-light">{item.description}</p>
          <div className="flex flex-wrap gap-2">
            {item.tags.map(tag => (
              <span key={tag} className="text-xs text-gray-200 bg-white/10 backdrop-blur-md px-2 py-1 rounded-full border border-white/20">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Hint */}
      <div 
        className="absolute top-4 right-4 bg-black/60 backdrop-blur-md rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 border border-white/10 z-20"
        aria-label={`Projekt ${item.title} ansehen`}
      >
        <ExternalLink size={16} className="text-white" aria-hidden="true" />
      </div>
    </motion.div>
  );
};
const PREVIEWS_DICTIONARY = {
  de: {
    badge: "Portfolio",
    title: "Websites, die",
    titleHighlight: "begeistern",
    sub: "Inspiriert von den besten Designs der Welt. Wir kreieren digitale Erlebnisse auf höchstem Niveau.",
    cta: "Eigenes Projekt besprechen",
    items: [
      {
        id: '1',
        title: 'Lusion',
        category: 'Creative Agency',
        image: 'https://lusion.co',
        description: 'Bold, experimental design mit innovativen Animationen und interaktiven Elementen.',
        tags: ['WebGL', '3D', 'Animation']
      },
      {
        id: '2',
        title: 'Amie',
        category: 'Productivity App',
        image: 'https://amie.so',
        description: 'Minimalistisches, funktionales Design für eine moderne Produktivitäts-App.',
        tags: ['Minimalism', 'UX', 'Product Design']
      },
      {
        id: '3',
        title: 'Vercel Ship',
        category: 'Tech / SaaS',
        image: 'https://vercel.com/ship',
        description: 'Futuristisches Interface mit Fokus auf Performance und User Experience.',
        tags: ['Next.js', 'Performance', 'Modern']
      },
      {
        id: '4',
        title: 'Metalab',
        category: 'Design Studio',
        image: 'https://metalab.com',
        description: 'Elegantes Portfolio-Design mit starkem visuellen Storytelling.',
        tags: ['Portfolio', 'Creative', 'Storytelling']
      },
      {
        id: '5',
        title: 'Notion',
        category: 'Product',
        image: 'https://notion.so',
        description: 'Clean, intuitive Design für eine komplexe Produktivitäts-Plattform.',
        tags: ['Clean Design', 'Complex UX', 'Branding']
      },
      {
        id: '6',
        title: 'SuperHi',
        category: 'Education',
        image: 'https://superhi.com',
        description: 'Engaging, interaktives Design für eine Online-Lernplattform.',
        tags: ['Education', 'Interactive', 'Engagement']
      }
    ]
  },
  en: {
    badge: "Portfolio",
    title: "Websites that",
    titleHighlight: "inspire",
    sub: "Inspired by the world's best designs. We create digital experiences at the highest level.",
    cta: "Discuss Your Project",
    items: [
      {
        id: '1',
        title: 'Lusion',
        category: 'Creative Agency',
        image: 'https://lusion.co',
        description: 'Bold, experimental design with innovative animations and interactive elements.',
        tags: ['WebGL', '3D', 'Animation']
      },
      {
        id: '2',
        title: 'Amie',
        category: 'Productivity App',
        image: 'https://amie.so',
        description: 'Minimalist, functional design for a modern productivity app.',
        tags: ['Minimalism', 'UX', 'Product Design']
      },
      {
        id: '3',
        title: 'Vercel Ship',
        category: 'Tech / SaaS',
        image: 'https://vercel.com/ship',
        description: 'Futuristic interface with focus on performance and user experience.',
        tags: ['Next.js', 'Performance', 'Modern']
      },
      {
        id: '4',
        title: 'Metalab',
        category: 'Design Studio',
        image: 'https://metalab.com',
        description: 'Elegant portfolio design with strong visual storytelling.',
        tags: ['Portfolio', 'Creative', 'Storytelling']
      },
      {
        id: '5',
        title: 'Notion',
        category: 'Product',
        image: 'https://notion.so',
        description: 'Clean, intuitive design for a complex productivity platform.',
        tags: ['Clean Design', 'Complex UX', 'Branding']
      },
      {
        id: '6',
        title: 'SuperHi',
        category: 'Education',
        image: 'https://superhi.com',
        description: 'Engaging, interactive design for an online learning platform.',
        tags: ['Education', 'Interactive', 'Engagement']
      }
    ]
  }
};

// Legacy previews removed - using PREVIEWS_DICTIONARY items only

export const WebsitePreviews: React.FC<{ lang?: 'de' | 'en' }> = ({ lang = 'de' }) => {
    const t = PREVIEWS_DICTIONARY[lang];
    const prefersReducedMotion = useReducedMotion();
    const scrollRef = useRef<HTMLDivElement>(null);
    
    // Use items directly without duplication for better performance
    const carouselItems = t.items;

    return (
    <section id="website-previews" className="py-24 sm:py-32 relative overflow-hidden scroll-mt-20">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-swiss-red/5 rounded-full blur-[120px] -mr-64 -mt-32" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] -ml-64 -mb-32" />

      <div className="container mx-auto px-6 relative z-20 mb-12">
        <div className="text-center max-w-3xl mx-auto">
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={prefersReducedMotion ? { duration: 0 } : {}}
            className="inline-block px-4 py-1.5 rounded-full bg-swiss-red/10 border border-swiss-red/20 text-swiss-red text-sm font-bold uppercase tracking-widest mb-4"
          >
            {t.badge}
          </motion.div>
          <motion.h2
            id="website-previews-heading"
            initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold font-display text-white mb-6"
          >
            {t.title} <span className="text-swiss-red">{t.titleHighlight}</span>
          </motion.h2>
          <motion.p
            initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.2 }}
            className="text-gray-300 text-lg"
          >
             {t.sub}
          </motion.p>
        </div>
      </div>

      {/* Horizontal Scroll Gallery */}
      <div className="relative w-full py-12 sm:py-20">
        <div className="container mx-auto px-6 max-w-7xl">
          {/* Scroll Cue */}
          <div className="mb-8 flex justify-center">
            <ScrollCue direction="horizontal" scrollRef={scrollRef} />
          </div>

          {/* Horizontal Scroll Container */}
          <div
            ref={scrollRef}
            className="overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent pb-6"
            style={{
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <div className="inline-flex gap-6 md:gap-8 min-w-full">
              {carouselItems.map((item, index) => (
                <PortfolioCard
                  key={item.id}
                  item={item}
                  index={index}
                  prefersReducedMotion={prefersReducedMotion}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 relative z-10 mt-16 text-center">
            <Magnetic strength={0.5}>
              <Button 
                onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
                variant="primary"
                className="inline-flex items-center gap-2"
              >
                {t.cta}
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
              </Button>
            </Magnetic>
      </div>

    </section>
  );
};
