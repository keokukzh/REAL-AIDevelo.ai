import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Navbar } from '../components/Navbar';
import { 
  WebdesignContactForm,
  FeatureCard, 
  BentoFeatures, 
  BentoGrid,
  TechnologyBadge, 
  PricingCard, 
  FloatingShapes, 
  Magnetic, 
  TypewriterTitle, 
  CursorFollower, 
  SmoothScroll,
  WebdesignAnimatedBackground,
  WebdesignProcessFlow,
  WebsitePreviews,
  ScrollReveal,
  Parallax,
  WebdesignHero
} from '../components/webdesign';
import { Globe, Smartphone, Zap, Search, Palette, Code, Shield, Clock, TrendingUp, LucideIcon, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Footer } from '../components/Footer';
import { BackButton } from '../components/navigation/BackButton';
import { ROUTES } from '../config/navigation';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface Technology {
  name: string;
  description: string;
}

const LazySection: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "0px 0px -200px 0px" });

  return (
    <div ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export const WebdesignPage = () => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  
  // Use scroll tracking for parallax effects
  // Hooks must always be called in the same order
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 100]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);

  const features = useMemo<Feature[]>(() => [
    {
      icon: Globe,
      title: 'Responsive Design',
      description: 'Ihre Website sieht auf allen Geräten perfekt aus - Desktop, Tablet und Smartphone. Pixelgenaue Umsetzung mit modernen CSS-Frameworks.',
    },
    {
      icon: Zap,
      title: 'Schnelle Ladezeiten',
      description: 'Optimierte Performance mit Code-Splitting, Lazy Loading und modernen Build-Tools. Lighthouse Score 90+ garantiert.',
    },
    {
      icon: Search,
      title: 'SEO-Optimierung',
      description: 'Meta-Tags, strukturierte Daten (Schema.org), XML-Sitemap und semantisches HTML für maximale Sichtbarkeit.',
    },
    {
      icon: Palette,
      title: 'Modernes Design',
      description: 'Zeitgemäßes, professionelles Design basierend auf aktuellen UI/UX-Trends und Best Practices.',
    },
    {
      icon: Code,
      title: 'Sauberer Code',
      description: 'Wartbarer, strukturierter Code nach modernen Standards (TypeScript, React, Tailwind CSS).',
    },
    {
      icon: Smartphone,
      title: 'Mobile-First',
      description: 'Mobile-optimierte Websites mit Touch-optimierter Navigation und schnellen Ladezeiten.',
    },
    {
      icon: Shield,
      title: 'Sicherheit',
      description: 'HTTPS, sichere Formulare, DSGVO-konform und regelmäßige Security-Updates.',
    },
    {
      icon: Clock,
      title: 'Schnelle Umsetzung',
      description: 'Professionelle Umsetzung in 2-3 Wochen. Klare Kommunikation und regelmäßige Updates.',
    },
    {
      icon: TrendingUp,
      title: 'Conversion-Optimierung',
      description: 'Strategisch platzierte CTAs, A/B-Testing-ready und datengetriebene Optimierungen.',
    },
  ], []);



  const technologies = useMemo<Technology[]>(() => [
    { name: 'React', description: 'Moderne Frontend-Bibliothek' },
    { name: 'TypeScript', description: 'Typsichere Entwicklung' },
    { name: 'Tailwind CSS', description: 'Utility-First CSS Framework' },
    { name: 'Vite', description: 'Schneller Build-Tool' },
    { name: 'Responsive Design', description: 'Mobile-First Ansatz' },
    { name: 'SEO-Optimiert', description: 'Suchmaschinen-freundlich' },
  ], []);

  const pricingFeatures = useMemo(() => [
    { text: 'Bis zu 5 Seiten (Home, Über uns, Services, Kontakt, etc.)' },
    { text: 'Responsive Design (Mobile, Tablet, Desktop)' },
    { text: 'Grundlegende SEO-Optimierung (Meta-Tags, Sitemap)' },
    { text: 'Kontaktformular mit E-Mail-Benachrichtigung' },
    { text: 'Social Media Integration (Links, Sharing)' },
    { text: 'Schnelle Ladezeiten (Lighthouse Score 90+)' },
    { text: 'Wartbarer, sauberer Code (TypeScript, React)' },
    { text: '2-3 Wochen Umsetzungszeit' },
  ], []);

  const handleScrollToForm = () => {
    const formSection = document.getElementById('contact-form');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      formSection.focus();
    }
  };

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div className="min-h-screen bg-background text-white selection:bg-swiss-red/30 overflow-hidden">
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-swiss-red z-[100] origin-left"
        style={{ scaleX }}
      />
      
      <SmoothScroll>
        <CursorFollower />
      {/* Skip to main content link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-swiss-red focus:text-white focus:rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
      >
        Zum Hauptinhalt springen
      </a>
      
      {/* Global Seamless Background */}
      <div className="fixed inset-0 z-[-1] pointer-events-none">
         <WebdesignAnimatedBackground variant="hero" intensity="medium" />
         <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-slate-950/80 to-slate-950" />
      </div>

      <Navbar />
      
      {/* Hero Section */}
      <WebdesignHero />

      {/* Process Flow Section */}
      <WebdesignProcessFlow />

      {/* Portfolio / Website Previews Section */}
      <WebsitePreviews />

      <div className="h-32 w-px bg-gradient-to-b from-swiss-red to-transparent mx-auto opacity-30" />

      {/* Pricing Section */}
      <section 
        id="pricing"
        className="py-12 sm:py-32 relative overflow-hidden"
        aria-labelledby="pricing-heading"
      >
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <ScrollReveal direction="up" delay={0.2} className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 id="pricing-heading" className="text-[clamp(1.875rem,4vw,2.5rem)] font-bold font-display mb-4">
                Transparente Preisgestaltung
              </h2>
              <p className="text-gray-400 text-lg">
                Alles inklusive – keine versteckten Kosten, keine Überraschungen
              </p>
            </div>
            
            <PricingCard
              price="599 CHF"
              subtitle="Einmalig - Alles inklusive"
              disclaimer="Keine monatlichen Gebühren • Keine versteckten Kosten"
              features={pricingFeatures}
            />
          </ScrollReveal>
        </div>
      </section>

      {/* Process Section - REMOVED (Redundant with new WebdesignProcessFlow) */}

      {/* Features Section */}
      <section 
        id="features"
        className="py-12 sm:py-24 relative overflow-hidden"
        aria-labelledby="features-heading"
      >
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <ScrollReveal direction="up" delay={0.2} className="text-center mb-16">
            <h2 id="features-heading" className="text-[clamp(1.875rem,4vw,2.5rem)] font-bold font-display mb-4">
              Professionelle Features
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Modernste Technologien und Best Practices für maximale Performance und Benutzerfreundlichkeit.
            </p>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.2} className="max-w-7xl mx-auto">
            <BentoGrid features={features} />
          </ScrollReveal>
        </div>
      </section>

      {/* Technologies Section */}
      <section 
        id="technologies"
        className="py-12 sm:py-24 relative overflow-hidden"
        aria-labelledby="technologies-heading"
      >
        <FloatingShapes />
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <ScrollReveal direction="up" delay={0.2} className="text-center mb-12">
            <h2 id="technologies-heading" className="text-[clamp(1.875rem,4vw,2.5rem)] font-bold font-display mb-4">
              Moderne Technologien
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Wir verwenden nur die besten und modernsten Tools für Ihre Website.
            </p>
          </ScrollReveal>

          <ScrollReveal stagger staggerDelay={0.05} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 max-w-5xl mx-auto list-none" aria-label="Technologien">
            {technologies.map((tech, index) => (
              <TechnologyBadge
                key={tech.name}
                name={tech.name}
                description={tech.description}
                index={index}
              />
            ))}
          </ScrollReveal>
        </div>
      </section>

      {/* Contact Form Section */}
      <section 
        id="contact-form"
        className="py-12 sm:py-32 relative overflow-hidden"
        aria-labelledby="contact-heading"
        tabIndex={-1}
      >
         {/* Background Spotlights */}
         <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-swiss-red/10 rounded-full blur-[128px] pointer-events-none" />
         <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[128px] pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <ScrollReveal direction="scale" delay={0.2} className="max-w-4xl mx-auto">
              
              <div className="relative z-10">
                <ScrollReveal direction="fade" delay={0.3} className="text-center mb-12">
                  <h2 id="contact-heading" className="text-[clamp(1.875rem,4vw,2.5rem)] font-bold font-display mb-4">
                    Projekt Starten
                  </h2>
                  <p className="text-gray-400 text-lg">
                    Bereit für den digitalen Aufstieg? Initiieren Sie jetzt Ihr Projekt.
                  </p>
                </ScrollReveal>

                <WebdesignContactForm onSuccess={() => navigate('/')} />
              </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Related Links Section */}
      <section 
        id="related-links"
        className="py-12 sm:py-20 relative"
        aria-labelledby="related-links-heading"
      >
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 id="related-links-heading" className="text-[clamp(1.875rem,4vw,2.5rem)] font-bold font-display mb-6">
              Weitere Services
            </h2>
            <p className="text-gray-400 mb-8">
              Entdecken Sie unsere anderen Angebote
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate(ROUTES.HOME)}
                variant="outline"
                className="min-h-[44px] min-w-[44px] text-white border-white/30 hover:border-white/60 hover:bg-white/5"
                aria-label="Zu Voice Agents navigieren"
              >
                Voice Agents
              </Button>
              <Button
                onClick={() => navigate(ROUTES.DASHBOARD)}
                variant="outline"
                className="min-h-[44px] min-w-[44px] text-white border-white/30 hover:border-white/60 hover:bg-white/5"
                aria-label="Zum Dashboard navigieren"
              >
                Dashboard
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
      </SmoothScroll>
    </div>
  );
};


