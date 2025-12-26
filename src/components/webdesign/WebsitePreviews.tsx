import React, { useRef } from 'react';
import { motion, useScroll, useSpring, useTransform, useVelocity, useAnimationFrame, useMotionValue } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { Magnetic } from './Magnetic';
import { Button } from '../ui/Button';

interface PreviewItem {
  id: string;
  title: string;
  category: string;
  image: string;
  description: string;
  tags: string[];
}
const PREVIEWS_DICTIONARY = {
  de: {
    badge: "Showcase",
    title: "Ausgewählte",
    titleHighlight: "Arbeiten",
    sub: "Entdecken Sie, wie wir Marken digital zum Leben erwecken.",
    cta: "Eigenes Projekt besprechen",
    items: [
      {
        id: '1',
        title: 'Alpine Dental Clinic',
        category: 'Medizintechnik',
        image: '/assets/previews/dentist_website_mockup.png',
        description: 'Modernes Redesign für eine Zahnarztpraxis mit Fokus auf Vertrauen und Online-Buchung.',
        tags: ['Next.js', 'Booking System', 'SEO']
      },
      {
        id: '2',
        title: 'Alta Cucina',
        category: 'Gastronomie',
        image: '/assets/previews/restaurant_website_mockup.png',
        description: 'Elegantes Design für ein High-End Restaurant mit Fokus auf Atmosphäre und Menü-Präsentation.',
        tags: ['Animation', 'Menu API', 'Reservations']
      },
      {
        id: '3',
        title: 'Neural Core AI',
        category: 'Technik / SaaS',
        image: '/assets/previews/saas_website_mockup.png',
        description: 'Futuristisches Interface für ein KI-Startup mit komplexen Daten-Visualisierungen.',
        tags: ['WebGL', 'Dark Mode', 'Dashboard']
      },
       {
        id: '4',
        title: 'Creative Agency',
        category: 'Agentur',
        image: '/assets/previews/agency_modern_mockup.png',
        description: 'Minimalistisches Portfolio für eine Design-Agentur mit Fokus auf visuelle Hierarchie.',
        tags: ['Minimalism', 'Portfolio', 'CMS']
      },
      {
        id: '5',
        title: 'Mobile App Showcase',
        category: 'App Landing',
        image: '/assets/previews/mobile_app_showcase.png',
        description: 'Conversion-optimierte Landing Page für eine neue Fintech-App.',
        tags: ['App Store', 'Conversion', '3D']
      }
    ]
  },
  en: {
    badge: "Showcase",
    title: "Selected",
    titleHighlight: "Works",
    sub: "Discover how we bring brands to life digitally.",
    cta: "Discuss Your Project",
    items: [
      {
        id: '1',
        title: 'Alpine Dental Clinic',
        category: 'Medical Tech',
        image: '/assets/previews/dentist_website_mockup.png',
        description: 'Modern redesign for a dental clinic with a focus on trust and online booking.',
        tags: ['Next.js', 'Booking System', 'SEO']
      },
      {
        id: '2',
        title: 'Alta Cucina',
        category: 'Gastronomy',
        image: '/assets/previews/restaurant_website_mockup.png',
        description: 'Elegant design for a high-end restaurant with a focus on atmosphere and menu presentation.',
        tags: ['Animation', 'Menu API', 'Reservations']
      },
      {
        id: '3',
        title: 'Neural Core AI',
        category: 'Tech / SaaS',
        image: '/assets/previews/saas_website_mockup.png',
        description: 'Futuristic interface for an AI startup with complex data visualizations.',
        tags: ['WebGL', 'Dark Mode', 'Dashboard']
      },
       {
        id: '4',
        title: 'Creative Agency',
        category: 'Agency',
        image: '/assets/previews/agency_modern_mockup.png',
        description: 'Minimalist portfolio for a design agency with a focus on visual hierarchy.',
        tags: ['Minimalism', 'Portfolio', 'CMS']
      },
      {
        id: '5',
        title: 'Mobile App Showcase',
        category: 'App Landing',
        image: '/assets/previews/mobile_app_showcase.png',
        description: 'Conversion-optimized landing page for a new fintech app.',
        tags: ['App Store', 'Conversion', '3D']
      }
    ]
  }
};

const PREVIEWS: PreviewItem[] = [
  {
    id: '1',
    title: 'Alpine Dental Clinic',
    category: 'Medizintechnik',
    image: '/assets/previews/dentist_website_mockup.png',
    description: 'Modernes Redesign für eine Zahnarztpraxis mit Fokus auf Vertrauen und Online-Buchung.',
    tags: ['Next.js', 'Booking System', 'SEO']
  },
  {
    id: '2',
    title: 'Alta Cucina',
    category: 'Gastronomie',
    image: '/assets/previews/restaurant_website_mockup.png',
    description: 'Elegantes Design für ein High-End Restaurant mit Fokus auf Atmosphäre und Menü-Präsentation.',
    tags: ['Animation', 'Menu API', 'Reservations']
  },
  {
    id: '3',
    title: 'Neural Core AI',
    category: 'Technik / SaaS',
    image: '/assets/previews/saas_website_mockup.png',
    description: 'Futuristisches Interface für ein KI-Startup mit komplexen Daten-Visualisierungen.',
    tags: ['WebGL', 'Dark Mode', 'Dashboard']
  },
   {
    id: '4',
    title: 'Creative Agency',
    category: 'Agentur',
    image: '/assets/previews/agency_modern_mockup.png',
    description: 'Minimalistisches Portfolio für eine Design-Agentur mit Fokus auf visuelle Hierarchie.',
    tags: ['Minimalism', 'Portfolio', 'CMS']
  },
  {
    id: '5',
    title: 'Mobile App Showcase',
    category: 'App Landing',
    image: '/assets/previews/mobile_app_showcase.png',
    description: 'Conversion-optimierte Landing Page für eine neue Fintech-App.',
    tags: ['App Store', 'Conversion', '3D']
  }
];

export const WebsitePreviews: React.FC<{ lang?: 'de' | 'en' }> = ({ lang = 'de' }) => {
    const t = PREVIEWS_DICTIONARY[lang];
    // Duplicate items for infinite loop
    const carouselItems = [...t.items, ...t.items]; 
    
    // Scroll-Linked Velocity Logic
    const { scrollY } = useScroll();
    const scrollVelocity = useVelocity(scrollY);
    const smoothVelocity = useSpring(scrollVelocity, {
      damping: 50,
      stiffness: 400
    });
    
    const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], {
      clamp: false
    });

    const baseVelocity = -15; // Default marquee speed
    const x = useMotionValue(0);

    useAnimationFrame((t, delta) => {
      let moveBy = baseVelocity * (delta / 1000);
      
      /**
       * This is what makes it feel ultra: 
       * The marquee speed reacts to scroll velocity!
       */
      const currentVelocityFactor = velocityFactor.get();
      // Increase speed when scrolling, but maintain a base direction
      moveBy += currentVelocityFactor * (delta / 1000) * -20;

      x.set(x.get() + moveBy);
    });

    // We'll use percentage wrap for the infinite loop
    const xPercent = useTransform(x, (v) => `${(v % 50)}%`);

    return (
    <section id="website-previews" className="py-24 bg-slate-950 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[120px] -mr-64 -mt-32" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] -ml-64 -mb-32" />

      <div className="container mx-auto px-6 relative z-10 mb-12">
        <div className="text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold uppercase tracking-widest mb-4"
          >
            {t.badge}
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold font-display text-white mb-6"
          >
            {t.title} <span className="text-red-500">{t.titleHighlight}</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-lg"
          >
             {t.sub}
          </motion.p>
        </div>
      </div>

      {/* Infinite Marquee with Velocity-Linked Speed */}
      <div 
        className="relative w-full overflow-hidden py-20 perspective-marquee group/marquee"
      >
          {/* Gradient Masks */}
          <div className="absolute top-0 left-0 w-48 h-full bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent z-10 pointer-events-none" />
          <div className="absolute top-0 right-0 w-48 h-full bg-gradient-to-l from-slate-950 via-slate-950/80 to-transparent z-10 pointer-events-none" />

          <motion.div 
            className="flex gap-12 w-max px-12"
            style={{ x: xPercent }}
          >
              {carouselItems.map((item, index) => (
                  <div 
                    key={`${item.id}-${index}`}
                    className="relative w-[450px] md:w-[600px] aspect-[16/10] flex-shrink-0 group rounded-3xl overflow-hidden border border-white/10 bg-slate-900 shadow-2xl perspective-card"
                  >
                        {/* Image */}
                        <img 
                            src={item.image} 
                            alt={`Preview of ${item.title}: ${item.category} Website Design`}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            loading="lazy"
                        />
                        
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8">
                            <div className="transform translate-y-6 group-hover:translate-y-0 transition-transform duration-500">
                                <span className="inline-block px-3 py-1 bg-red-600/20 text-red-500 text-[10px] font-bold rounded-full mb-3 border border-red-500/20 uppercase tracking-widest">
                                    {item.category}
                                </span>
                                <h3 className="text-3xl font-bold text-white mb-2">{item.title}</h3>
                                <p className="text-gray-300 text-base line-clamp-2 mb-4 font-light">{item.description}</p>
                                <div className="flex gap-2">
                                    {item.tags.map(tag => (
                                        <span key={tag} className="text-[10px] text-gray-400 bg-white/5 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Interactive Hint */}
                         <div 
                            className="absolute top-6 right-6 bg-black/60 backdrop-blur-md rounded-full p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 border border-white/10 scale-75 group-hover:scale-100"
                            aria-label={`Projekt ${item.title} ansehen`}
                         >
                            <ExternalLink size={20} className="text-white" />
                         </div>
                  </div>
              ))}
          </motion.div>
      </div>

      <div className="container mx-auto px-6 relative z-10 mt-16 text-center">
            <Magnetic strength={0.5}>
              <Button 
                onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
                variant="primary"
                className="inline-flex items-center gap-2"
              >
                {t.cta}
                <ExternalLink className="w-4 h-4" />
              </Button>
            </Magnetic>
      </div>

    </section>
  );
};
