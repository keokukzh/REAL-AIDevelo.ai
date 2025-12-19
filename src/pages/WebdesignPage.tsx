import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from '../components/Navbar';
import { WebdesignContactForm } from '../components/WebdesignContactForm';
import { Globe, Smartphone, Zap, Search, Palette, Code, Shield, Clock, TrendingUp, LucideIcon, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Footer } from '../components/Footer';
import { BackButton } from '../components/navigation/BackButton';
import { ROUTES } from '../config/navigation';
import { FeatureCard, ProcessStepCard, TechnologyBadge, PricingCard } from '../components/webdesign';

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
      title: 'Konsultation',
      description: 'Wir besprechen Ihre Anforderungen, Ziele und Vision für Ihre Website in einem ausführlichen Gespräch.',
    },
    {
      number: '02',
      title: 'Konzept & Design',
      description: 'Erstellung eines detaillierten Konzepts mit Wireframes und Design-Mockups für Ihre Freigabe.',
    },
    {
      number: '03',
      title: 'Entwicklung',
      description: 'Professionelle Umsetzung mit modernen Technologien, regelmäßigen Updates und Feedback-Schleifen.',
    },
    {
      number: '04',
      title: 'Testing & Launch',
      description: 'Umfassendes Testing auf allen Geräten, Performance-Optimierung und finaler Launch.',
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
        className="relative min-h-[60vh] flex items-center justify-center overflow-hidden pt-24 sm:pt-32 pb-12 sm:pb-20"
        aria-labelledby="hero-heading"
      >
        {/* Background */}
        <div 
          className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_90%)] -z-40 pointer-events-none" 
          aria-hidden="true"
        />
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto space-y-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-block px-4 py-2 bg-swiss-red/20 border border-swiss-red/30 rounded-full mb-6"
            >
              <span className="text-sm font-semibold text-swiss-red">Professionelle Webentwicklung</span>
            </motion.div>
            <h1 
              id="hero-heading"
              className="text-[clamp(2rem,5vw,4.5rem)] font-bold font-display leading-tight tracking-tight"
            >
              <span className="text-white">Website-Erstellung oder</span>
              <br />
              <span className="text-swiss-red">Redesign für 500 CHF</span>
            </h1>
            <p className="text-[clamp(1rem,2.5vw,1.5rem)] text-gray-400 mt-6 max-w-3xl mx-auto leading-relaxed">
              Professionelle, moderne Websites mit modernsten Technologien. Von der Konzeption bis zum Launch – alles aus einer Hand.
              <br />
              <span className="text-white font-semibold">Perfekt für kleine und mittlere Unternehmen.</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Button
                onClick={handleScrollToForm}
                variant="primary"
                className="bg-swiss-red hover:bg-red-700 text-white border-none min-h-[44px] min-w-[44px] font-semibold shadow-lg shadow-swiss-red/30"
                aria-label="Zum Kontaktformular scrollen"
              >
                Jetzt anfragen
              </Button>
              <BackButton
                to={ROUTES.HOME}
                label="Zurück zur Startseite"
                variant="outline"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section 
        id="pricing"
        className="py-12 sm:py-20 bg-slate-950/50"
        aria-labelledby="pricing-heading"
      >
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-12">
              <h2 id="pricing-heading" className="text-[clamp(1.875rem,4vw,2.5rem)] font-bold font-display mb-4">
                Transparente Preisgestaltung
              </h2>
              <p className="text-gray-400 text-lg">
                Alles inklusive – keine versteckten Kosten, keine Überraschungen
              </p>
            </div>
            
            <PricingCard
              price="500 CHF"
              subtitle="Einmalig - Alles inklusive"
              disclaimer="Keine monatlichen Gebühren • Keine versteckten Kosten"
              features={pricingFeatures}
            />
          </motion.div>
        </div>
      </section>

      {/* Process Section */}
      <section 
        id="process"
        className="py-12 sm:py-20"
        aria-labelledby="process-heading"
      >
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 id="process-heading" className="text-[clamp(1.875rem,4vw,2.5rem)] font-bold font-display mb-4">
              Unser Prozess
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Von der ersten Idee bis zum Launch – strukturiert, transparent und professionell.
            </p>
          </motion.div>

          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto mb-12 sm:mb-20 list-none" aria-label="Prozess-Schritte">
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
          </ul>
        </div>
      </section>

      {/* Features Section */}
      <section 
        id="features"
        className="py-12 sm:py-20 bg-slate-950/30"
        aria-labelledby="features-heading"
      >
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 id="features-heading" className="text-[clamp(1.875rem,4vw,2.5rem)] font-bold font-display mb-4">
              Professionelle Features
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Modernste Technologien und Best Practices für maximale Performance und Benutzerfreundlichkeit.
            </p>
          </motion.div>

          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto list-none" aria-label="Features">
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                index={index}
              />
            ))}
          </ul>
        </div>
      </section>

      {/* Technologies Section */}
      <section 
        id="technologies"
        className="py-12 sm:py-20"
        aria-labelledby="technologies-heading"
      >
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 id="technologies-heading" className="text-[clamp(1.875rem,4vw,2.5rem)] font-bold font-display mb-4">
              Moderne Technologien
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Wir verwenden nur die besten und modernsten Tools für Ihre Website.
            </p>
          </motion.div>

          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 max-w-5xl mx-auto list-none" aria-label="Technologien">
            {technologies.map((tech, index) => (
              <TechnologyBadge
                key={tech.name}
                name={tech.name}
                description={tech.description}
                index={index}
              />
            ))}
          </ul>
        </div>
      </section>

      {/* Contact Form Section */}
      <section 
        id="contact-form"
        className="py-12 sm:py-20 bg-slate-950/50"
        aria-labelledby="contact-heading"
        tabIndex={-1}
      >
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto"
          >
            <div className="bg-surface/50 rounded-2xl border border-white/10 p-6 sm:p-8 md:p-12">
              <div className="text-center mb-8">
                <h2 id="contact-heading" className="text-[clamp(1.875rem,4vw,2.5rem)] font-bold font-display mb-4">
                  Jetzt anfragen
                </h2>
                <p className="text-gray-400 text-lg">
                  Beschreiben Sie Ihr Projekt und wir melden uns innerhalb von 24 Stunden bei Ihnen.
                </p>
              </div>

              <WebdesignContactForm onSuccess={() => navigate('/')} />
            </div>
          </motion.div>
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


