import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Navbar } from '../components/Navbar';
import { WebdesignContactForm } from '../components/WebdesignContactForm';
import { Globe, Smartphone, Zap, Search, Palette, Code, Shield, Clock, TrendingUp, LucideIcon, ArrowLeft, CheckCircle, ArrowDown } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Footer } from '../components/Footer';
import { BackButton } from '../components/navigation/BackButton';
import { ROUTES } from '../config/navigation';
import { FeatureCard, ProcessStepCard, TechnologyBadge, PricingCard } from '../components/webdesign';
import { WebdesignAnimatedBackground } from '../components/webdesign/WebdesignAnimatedBackground';
import { ScrollReveal, Parallax } from '../components/webdesign/ScrollReveal';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { WebdesignProcessFlow } from '../components/webdesign/WebdesignProcessFlow';
import { WebsitePreviews } from '../components/webdesign/WebsitePreviews';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface ProcessStep {
  number: string;
  title: string;
  description: string;
}

interface Technology {
  name: string;
  description: string;
}

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

  const processSteps = useMemo<ProcessStep[]>(() => [
    {
      number: '01',
      title: 'Anfrage',
      description: 'Onboarding Formular ausfüllen und benötigte Daten direkt mitsenden.',
    },
    {
      number: '02',
      title: 'Anzahlung',
      description: 'Nach Review durch unser Team erhalten Sie den Link für die 100 CHF Anzahlung.',
    },
    {
      number: '03',
      title: 'Umsetzung',
      description: 'Wir erstellen Ihre Website basierend auf Ihren Wünschen in 2-3 Wochen.',
    },
    {
      number: '04',
      title: 'Launch',
      description: 'Nach Testphase und Restzahlung übergeben wir Ihnen alle Logindaten.',
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

  return (
    <div className="min-h-screen bg-background text-white">
      {/* Skip to main content link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-swiss-red focus:text-white focus:rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
      >
        Zum Hauptinhalt springen
      </a>
      
      <Navbar />
      
      {/* Hero Section */}
      <section 
        id="hero"
        className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 sm:pt-32 pb-12 sm:pb-20"
        aria-labelledby="hero-heading"
      >
        {/* Animated Background */}
        <WebdesignAnimatedBackground variant="hero" intensity="high" />
        
        {/* Base Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-slate-950 to-background -z-50" aria-hidden="true" />
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              style={{ y: prefersReducedMotion ? 0 : heroY, opacity: prefersReducedMotion ? 1 : heroOpacity }}
              className="text-left space-y-8"
            >
              {/* Badge with Shine Effect */}
              <ScrollReveal direction="fade" delay={0.2}>
                <motion.div
                  className="inline-block px-4 py-2 bg-swiss-red/20 border border-swiss-red/30 rounded-full mb-6 backdrop-blur-sm relative overflow-hidden group"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <div className="relative flex items-center gap-2">
                    <Globe className="w-4 h-4 text-swiss-red" />
                    <span className="text-sm font-semibold text-swiss-red uppercase tracking-wide">
                      Professionelle Webentwicklung
                    </span>
                  </div>
                </motion.div>
              </ScrollReveal>

              {/* Heading with Kinetic Typography */}
              <ScrollReveal direction="up" delay={0.4} duration={0.8}>
                <h1 
                  id="hero-heading"
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-display leading-[1.1] tracking-tight"
                >
                  <motion.span
                    className="text-white block"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                  >
                    Neue Website oder
                  </motion.span>
                  <motion.span
                    className="text-swiss-red block mt-2 bg-gradient-to-r from-swiss-red via-red-500 to-swiss-red bg-clip-text text-transparent bg-[length:200%_auto]"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      backgroundPosition: prefersReducedMotion ? '0%' : ['0%', '100%', '0%']
                    }}
                    transition={{ 
                      duration: 0.8, 
                      delay: 0.6,
                      backgroundPosition: { duration: 3, repeat: Infinity, ease: 'linear' }
                    }}
                  >
                    Redesign für 599 CHF
                  </motion.span>
                </h1>
              </ScrollReveal>

              {/* Subheading */}
              <ScrollReveal direction="up" delay={0.6} duration={0.8}>
                <p className="text-lg sm:text-xl text-gray-400 mt-6 max-w-xl leading-relaxed">
                  Professionelle, moderne Websites mit modernsten Technologien. Von der Konzeption bis zum Launch – alles zum transparenten Festpreis.
                  <br />
                  <span className="text-white font-semibold mt-2 block">Premium-Design für Schweizer KMU.</span>
                </p>
              </ScrollReveal>

              {/* CTA Buttons with Glow Effects */}
              <ScrollReveal direction="up" delay={0.8} duration={0.8}>
                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative"
                  >
                    <div className="absolute inset-0 bg-swiss-red blur-xl opacity-50 animate-pulse" />
                    <Button
                      onClick={handleScrollToForm}
                      variant="primary"
                      className="relative bg-swiss-red hover:bg-red-700 text-white border-none min-h-[56px] px-8 font-semibold shadow-lg shadow-swiss-red/50"
                      aria-label="Zum Kontaktformular scrollen"
                    >
                      Jetzt Projekt anfragen
                    </Button>
                  </motion.div>
                  <BackButton
                    to={ROUTES.HOME}
                    label="Zurück zur Startseite"
                    variant="ghost"
                    className="text-gray-400 hover:text-white"
                  />
                </div>
              </ScrollReveal>

              {/* Trust Indicators */}
              <div className="flex items-center gap-6 pt-12 border-t border-white/5 mt-12 overflow-x-auto no-scrollbar">
                <div className="flex flex-col">
                  <span className="text-white font-bold text-xl leading-none">100%</span>
                  <span className="text-xs text-gray-500 uppercase tracking-widest mt-1">Zufriedenheit</span>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="flex flex-col">
                  <span className="text-white font-bold text-xl leading-none">24h</span>
                  <span className="text-xs text-gray-500 uppercase tracking-widest mt-1">Reaktionszeit</span>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="flex flex-col">
                  <span className="text-white font-bold text-xl leading-none">Swiss</span>
                  <span className="text-xs text-gray-500 uppercase tracking-widest mt-1">Developed</span>
                </div>
              </div>
            </motion.div>

            {/* Right Side: Floating Website Preview */}
            <ScrollReveal direction="fade" delay={0.5} className="hidden lg:block relative perspective-1000">
              <motion.div
                initial={{ opacity: 0, x: 100, rotateY: -10 }}
                animate={{ opacity: 1, x: 0, rotateY: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="relative"
              >
                {/* Decorative glows behind the card */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-swiss-red/20 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500/20 rounded-full blur-[100px] animate-pulse" />

                {/* The Main Laptop/Browser Mockup */}
                <div className="relative z-10 bg-slate-900 rounded-2xl border border-white/10 p-2 shadow-2xl shadow-black/50 transform-gpu hover:rotate-2 transition-transform duration-500">
                  <div className="bg-slate-800 rounded-xl overflow-hidden aspect-[16/10] border border-white/5">
                    <img 
                      src="/assets/previews/saas_website_mockup.png" 
                      alt="Website Preview Mockup" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Browser Controls */}
                  <div className="absolute top-5 left-5 flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                  </div>
                </div>

                {/* Floating Secondary Cards */}
                <motion.div
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -bottom-10 -right-10 z-20 w-48 bg-white rounded-xl p-4 shadow-2xl border border-slate-200"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div className="h-2 w-20 bg-slate-100 rounded" />
                  </div>
                  <div className="h-1.5 w-full bg-slate-50 rounded mb-1" />
                  <div className="h-1.5 w-2/3 bg-slate-50 rounded" />
                </motion.div>

                <motion.div
                  animate={{ y: [0, 15, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="absolute -top-10 -left-10 z-20 w-40 bg-slate-900/90 backdrop-blur-md rounded-xl p-4 shadow-2xl border border-white/10"
                >
                  <div className="flex justify-between items-center mb-3">
                    <div className="h-2 w-12 bg-swiss-red/40 rounded" />
                    <div className="w-2 h-2 rounded-full bg-swiss-red shadow-[0_0_8px_rgba(218,41,28,0.8)]" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-1.5 w-full bg-white/10 rounded" />
                    <div className="h-1.5 w-5/6 bg-white/10 rounded" />
                    <div className="h-1.5 w-4/6 bg-white/10 rounded" />
                  </div>
                </motion.div>
              </motion.div>
            </ScrollReveal>
          </div>
        </div>

        {/* Scroll Indicator */}
        <ScrollReveal direction="fade" delay={1.2}>
          <motion.div
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ArrowDown className="w-6 h-6 text-gray-400" />
          </motion.div>
        </ScrollReveal>
      </section>

      {/* Process Flow Section */}
      <WebdesignProcessFlow />

      {/* Portfolio / Website Previews Section */}
      <WebsitePreviews />

      {/* Pricing Section */}
      <section 
        id="pricing"
        className="py-12 sm:py-20 bg-slate-950/50 relative overflow-hidden"
        aria-labelledby="pricing-heading"
      >
        <WebdesignAnimatedBackground variant="section" intensity="low" />
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

      {/* Process Section */}
      <section 
        id="process"
        className="py-12 sm:py-20 relative overflow-hidden"
        aria-labelledby="process-heading"
      >
        <WebdesignAnimatedBackground variant="section" intensity="low" />
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <ScrollReveal direction="up" delay={0.2} className="text-center mb-16">
            <h2 id="process-heading" className="text-[clamp(1.875rem,4vw,2.5rem)] font-bold font-display mb-4">
              Unser Prozess
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Von der ersten Idee bis zum Launch – strukturiert, transparent und professionell.
            </p>
          </ScrollReveal>

          <ScrollReveal stagger staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto mb-12 sm:mb-20 list-none" aria-label="Prozess-Schritte">
            {processSteps.map((step, index) => (
              <ProcessStepCard
                key={step.number}
                number={step.number}
                title={step.title}
                description={step.description}
                isLast={index === processSteps.length - 1}
                index={index}
              />
            ))}
          </ScrollReveal>
        </div>
      </section>

      {/* Features Section */}
      <section 
        id="features"
        className="py-12 sm:py-20 bg-slate-950/30 relative overflow-hidden"
        aria-labelledby="features-heading"
      >
        <WebdesignAnimatedBackground variant="section" intensity="medium" />
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <ScrollReveal direction="up" delay={0.2} className="text-center mb-12">
            <h2 id="features-heading" className="text-[clamp(1.875rem,4vw,2.5rem)] font-bold font-display mb-4">
              Professionelle Features
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Modernste Technologien und Best Practices für maximale Performance und Benutzerfreundlichkeit.
            </p>
          </ScrollReveal>

          <ScrollReveal stagger staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto list-none" aria-label="Features">
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                index={index}
              />
            ))}
          </ScrollReveal>
        </div>
      </section>

      {/* Technologies Section */}
      <section 
        id="technologies"
        className="py-12 sm:py-20 relative overflow-hidden"
        aria-labelledby="technologies-heading"
      >
        <WebdesignAnimatedBackground variant="section" intensity="low" />
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
        className="py-12 sm:py-20 bg-slate-950/50 relative overflow-hidden"
        aria-labelledby="contact-heading"
        tabIndex={-1}
      >
        <WebdesignAnimatedBackground variant="section" intensity="medium" />
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <ScrollReveal direction="scale" delay={0.2} className="max-w-3xl mx-auto">
            <motion.div
              className="bg-surface/50 rounded-2xl border border-white/10 p-6 sm:p-8 md:p-12 backdrop-blur-md relative overflow-hidden"
              whileHover={{ borderColor: 'rgba(218, 41, 28, 0.3)' }}
              transition={{ duration: 0.3 }}
            >
              {/* Glassmorphism Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
              
              <div className="relative z-10">
                <ScrollReveal direction="fade" delay={0.3} className="text-center mb-8">
                  <h2 id="contact-heading" className="text-[clamp(1.875rem,4vw,2.5rem)] font-bold font-display mb-4">
                    Jetzt anfragen
                  </h2>
                  <p className="text-gray-400 text-lg">
                    Beschreiben Sie Ihr Projekt und wir melden uns innerhalb von 24 Stunden bei Ihnen.
                  </p>
                </ScrollReveal>

                <WebdesignContactForm onSuccess={() => navigate('/')} />
              </div>
            </motion.div>
          </ScrollReveal>
        </div>
      </section>

      {/* Related Links Section */}
      <section 
        id="related-links"
        className="py-12 sm:py-20 bg-slate-950/30"
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
    </div>
  );
};


