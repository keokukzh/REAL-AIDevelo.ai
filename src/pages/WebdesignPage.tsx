import React, { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Navbar } from '../components/Navbar';
import { useState, useEffect, Suspense, lazy } from 'react';
import {
  WebdesignContactForm,
  PricingCard,
  ScrollReveal,
  WebdesignAnimatedBackground,
  WebdesignHero,
  WebdesignInquiryWidget,
} from '../components/webdesign';
import { ErrorBoundary } from '../components/ErrorBoundary';

// Lazy-load heavy below-the-fold sections for better LCP
const WebdesignProcessFlow = lazy(() =>
  import('../components/webdesign/WebdesignProcessFlow').then((m) => ({
    default: m.WebdesignProcessFlow,
  })),
) as React.LazyExoticComponent<React.FC<{ lang?: 'de' | 'en' }>>;

const WebsitePreviews = lazy(() =>
  import('../components/webdesign/WebsitePreviews').then((m) => ({ default: m.WebsitePreviews })),
) as React.LazyExoticComponent<React.FC<{ lang?: 'de' | 'en' }>>;

const WebdesignTechStack = lazy(() =>
  import('../components/webdesign/WebdesignTechStack').then((m) => ({
    default: m.WebdesignTechStack,
  })),
) as React.LazyExoticComponent<React.FC<{ lang?: 'de' | 'en' }>>;

import {
  Globe,
  Smartphone,
  Zap,
  Search,
  Palette,
  Code,
  Shield,
  LucideIcon,
  ArrowRight,
  Layout,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Footer } from '../components/Footer';
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

const DICTIONARY = {
  de: {
    heroText1: 'Moderne Websites &',
    heroText2: 'Elegantes Redesign',
    heroSub:
      'Professionelle, moderne Websites mit modernsten Technologien. Von der Konzeption bis zum Launch – alles zum transparenten Festpreis.',
    missionStart: 'Jetzt Projekt anfragen',
    showSpecs: 'Systemdaten ansehen',
    closeSpecs: 'Analyse schließen',
    pricingTitle: 'Transparente Preisgestaltung',
    pricingSub:
      'Alles inklusive – keine versteckten Kosten, keine Überraschungen',
    pricingInvest: 'Investition',
    pricingSubtitle: 'Einmalig - Alles inklusive',
    pricingDisclaimer: 'Keine monatlichen Gebühren • Keine versteckten Kosten',
    featuresTitle: 'Professionelle Features',
    featuresSub:
      'Modernste Technologien und Best Practices für maximale Performance und Benutzerfreundlichkeit.',
    processTitle: 'Unser Prozess',
    processSub: 'Von der ersten Idee bis zum Launch – strukturiert, transparent und professionell.',
    technologiesTitle: 'Moderne Technologien',
    technologiesSub: 'Wir verwenden nur die besten und modernsten Tools für Ihre Website.',
    contactTitle: 'Jetzt anfragen',
    contactSub: 'Beschreiben Sie Ihr Projekt und wir melden uns innerhalb von 24 Stunden bei Ihnen.',
    relatedTitle: 'Weitere Services',
    skipToContent: 'Zum Hauptinhalt springen',
    scrollExplore: 'Scrollen zum Entdecken',
  },
  en: {
    heroText1: 'Modern Websites &',
    heroText2: 'Elegant Redesign',
    heroSub:
      'Professional, modern websites with cutting-edge technologies. From concept to launch – everything at a transparent fixed price.',
    missionStart: 'Start Project',
    showSpecs: 'View System Data',
    closeSpecs: 'Close Analysis',
    pricingTitle: 'Transparent Pricing',
    pricingSub:
      'All inclusive – no hidden costs, no surprises',
    pricingInvest: 'Investment',
    pricingSubtitle: 'One-time - All inclusive',
    pricingDisclaimer: 'No monthly fees • No hidden costs',
    featuresTitle: 'Professional Features',
    featuresSub: 'State-of-the-art technologies and best practices for maximum performance and user-friendliness.',
    processTitle: 'Our Process',
    processSub: 'From the first idea to launch – structured, transparent and professional.',
    technologiesTitle: 'Modern Technologies',
    technologiesSub: 'We use only the best and most modern tools for your website.',
    contactTitle: 'Request Now',
    contactSub: 'Describe your project and we will get back to you within 24 hours.',
    relatedTitle: 'Other Services',
    skipToContent: 'Skip to main content',
    scrollExplore: 'Scroll to Explore',
  },
};

export const WebdesignPage = () => {
  const navigate = useNavigate();
  const [lang, setLang] = useState<'de' | 'en'>('de');
  const t = DICTIONARY[lang];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('lang') === 'en') setLang('en');
  }, []);

  const handleLangChange = useCallback((newLang: 'de' | 'en') => {
    setLang(newLang);
  }, []);

  const features = useMemo<Feature[]>(
    () => [
      {
        icon: Globe,
        title: 'Responsive Design',
        description:
          'Ihre Website sieht auf allen Geräten perfekt aus - Desktop, Tablet und Smartphone. Pixelgenaue Umsetzung mit modernen CSS-Frameworks.',
      },
      {
        icon: Zap,
        title: 'Schnelle Ladezeiten',
        description:
          'Optimierte Performance mit Code-Splitting, Lazy Loading und modernen Build-Tools. Lighthouse Score 90+ garantiert.',
      },
      {
        icon: Search,
        title: 'SEO-Optimierung',
        description:
          'Meta-Tags, strukturierte Daten (Schema.org), XML-Sitemap und semantisches HTML für maximale Sichtbarkeit.',
      },
      {
        icon: Palette,
        title: 'Modernes Design',
        description:
          'Zeitgemäßes, professionelles Design basierend auf aktuellen UI/UX-Trends und Best Practices.',
      },
      {
        icon: Code,
        title: 'Sauberer Code',
        description:
          'Wartbarer, strukturierter Code nach modernen Standards (TypeScript, React, Tailwind CSS).',
      },
      {
        icon: Smartphone,
        title: 'Mobile-First',
        description:
          'Mobile-optimierte Websites mit Touch-optimierter Navigation und schnellen Ladezeiten.',
      },
      {
        icon: Shield,
        title: 'Sicherheit',
        description: 'HTTPS, sichere Formulare, DSGVO-konform und regelmäßige Security-Updates.',
      },
    ],
    [],
  );

  const technologies = useMemo<Technology[]>(
    () => [
      { name: 'React', description: 'Moderne Frontend-Bibliothek' },
      { name: 'TypeScript', description: 'Typsichere Entwicklung' },
      { name: 'Tailwind CSS', description: 'Utility-First CSS Framework' },
      { name: 'Vite', description: 'Schneller Build-Tool' },
      { name: 'Responsive Design', description: 'Mobile-First Ansatz' },
      { name: 'SEO-Optimiert', description: 'Suchmaschinen-freundlich' },
    ],
    [],
  );

  const pricingFeatures = useMemo(
    () => [
      { text: 'Bis zu 5 Seiten (Home, Über uns, Services, Kontakt, etc.)' },
      { text: 'Responsive Design (Mobile, Tablet, Desktop)' },
      { text: 'Grundlegende SEO-Optimierung (Meta-Tags, Sitemap)' },
      { text: 'Kontaktformular mit E-Mail-Benachrichtigung' },
      { text: 'Social Media Integration (Links, Sharing)' },
      { text: 'Schnelle Ladezeiten (Lighthouse Score 90+)' },
      { text: 'Wartbarer, sauberer Code (TypeScript, React)' },
      { text: '2-3 Wochen Umsetzungszeit' },
    ],
    [],
  );

  const processSteps = useMemo(
    () => [
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
    ],
    [],
  );

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-swiss-red/30 overflow-x-hidden selection:text-white">
      <Helmet>
        <title>Premium Webdesign & Elegantes Redesign | AIDevelo</title>
        <meta
          name="description"
          content="Professionelle, moderne Websites mit modernsten Technologien. Von der Konzeption bis zum Launch – alles zum transparenten Festpreis von 599 CHF."
        />
        <meta property="og:title" content="Premium Webdesign | AIDevelo" />
        <meta
          property="og:description"
          content="Moderne Websites & Elegantes Redesign. Professionelle Umsetzung zum transparenten Festpreis."
        />
        <meta property="og:type" content="website" />
        <link rel="alternate" hrefLang="de-CH" href="https://aidevelo.ai/webdesign" />
        <link rel="alternate" hrefLang="en" href="https://aidevelo.ai/en/webdesign" />
      </Helmet>

      {/* Language & Theme Switcher */}
      <div className="fixed top-24 right-8 z-[100] flex items-center gap-3">
        <ThemeToggle />
        <div className="flex gap-2">
          <button
            onClick={() => handleLangChange('de')}
            className={`px-3 py-1 rounded-full text-xs font-mono border transition-all ${lang === 'de' ? 'bg-swiss-red border-swiss-red text-white shadow-[0_0_15px_rgba(218,41,28,0.4)]' : 'bg-slate-900/50 border-white/10 text-gray-400 hover:border-white/30'}`}
            aria-label="Switch to German"
          >
            DE
          </button>
          <button
            onClick={() => handleLangChange('en')}
            className={`px-3 py-1 rounded-full text-xs font-mono border transition-all ${lang === 'en' ? 'bg-swiss-red border-swiss-red text-white shadow-[0_0_15px_rgba(218,41,28,0.4)]' : 'bg-slate-900/50 border-white/10 text-gray-400 hover:border-white/30'}`}
            aria-label="Switch to English"
          >
            EN
          </button>
        </div>
      </div>

      {/* Premium Scroll Progress */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-swiss-red via-red-500 to-swiss-red z-[100] origin-left shadow-[0_0_20px_rgba(218,41,28,0.5)]"
        style={{ scaleX }}
      />

      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-swiss-red focus:text-white focus:rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
      >
        {t.skipToContent}
      </a>

      {/* Global Seamless Background */}
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <WebdesignAnimatedBackground variant="hero" intensity="medium" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-950/80 to-slate-950" />
      </div>

      <Navbar />

      <main id="main-content">
        {/* Hero Section */}
        <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 sm:pt-32 pb-12 sm:pb-20">
          <ErrorBoundary fallback={<WebdesignHero t={t} />}>
            <WebdesignHero t={t} />
          </ErrorBoundary>
        </section>

        {/* Process Flow Section */}
        <Suspense fallback={<div className="h-96 bg-slate-900/50 animate-pulse" />}>
          <WebdesignProcessFlow lang={lang} />
        </Suspense>

        {/* Portfolio / Website Previews Section */}
        <Suspense fallback={<div className="h-96 bg-slate-900/50 animate-pulse" />}>
          <WebsitePreviews lang={lang} />
        </Suspense>

        {/* Pricing Section */}
        <section
          id="pricing"
          className="py-12 sm:py-20 bg-slate-950/50 relative overflow-hidden"
          aria-labelledby="pricing-heading"
        >
          <div className="container mx-auto px-6 relative z-10">
            <ScrollReveal direction="up" delay={0.1} className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <h2
                  id="pricing-heading"
                  className="text-4xl md:text-6xl font-bold font-display mb-6 tracking-tight"
                >
                  {t.pricingTitle}
                </h2>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto font-light">
                  {t.pricingSub}
                </p>
              </div>

              <PricingCard
                price="599 CHF"
                subtitle={t.pricingSubtitle}
                disclaimer={t.pricingDisclaimer}
                features={pricingFeatures}
              />
            </ScrollReveal>
          </div>
        </section>

        {/* Process Section */}
        <section
          id="process"
          className="py-24 relative overflow-hidden"
          aria-labelledby="process-heading"
        >
          <div className="container mx-auto px-6 relative z-10">
            <ScrollReveal direction="up" className="text-center mb-16">
              <h2
                id="process-heading"
                className="text-4xl md:text-6xl font-bold font-display mb-6 tracking-tight"
              >
                {t.processTitle}
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto font-light">
                {t.processSub}
              </p>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {processSteps.map((step, index) => (
                <ScrollReveal key={step.number} direction="up" delay={index * 0.1}>
                  <article className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-colors">
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-4xl font-bold font-display text-swiss-red opacity-50">
                        {step.number}
                      </span>
                      <h3 className="text-2xl font-bold text-white">{step.title}</h3>
                    </div>
                    <p className="text-gray-400 leading-relaxed">{step.description}</p>
                  </article>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          id="features"
          className="py-12 sm:py-20 bg-slate-950/30 relative overflow-hidden"
          aria-labelledby="features-heading"
        >
          <div className="container mx-auto px-6 relative z-10">
            <ScrollReveal direction="up" className="text-center mb-16">
              <h2
                id="features-heading"
                className="text-4xl md:text-6xl font-bold font-display mb-6 tracking-tight"
              >
                {t.featuresTitle}
              </h2>
              <p className="text-gray-400 text-lg max-w-3xl mx-auto font-light">
                {t.featuresSub}
              </p>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {features.map((feature, index) => (
                <ScrollReveal key={feature.title} direction="up" delay={index * 0.1}>
                  <button className="text-left w-full p-6 rounded-2xl bg-slate-900/40 backdrop-blur-md border border-white/5 hover:border-white/20 transition-all group">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10 group-hover:bg-swiss-red/10 transition-colors">
                        <feature.icon className="w-6 h-6 text-swiss-red" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                      </div>
                      <ArrowRight
                        size={20}
                        className="text-gray-400 group-hover:text-swiss-red group-hover:translate-x-1 transition-all"
                        aria-hidden="true"
                      />
                    </div>
                  </button>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Technologies Section */}
        <Suspense fallback={<div className="h-96 bg-slate-900/50 animate-pulse" />}>
          <WebdesignTechStack lang={lang} />
        </Suspense>

        {/* Contact Form Section */}
        <section
          id="contact-form"
          className="py-12 sm:py-20 bg-slate-950/50 relative overflow-hidden"
          aria-labelledby="contact-heading"
          tabIndex={-1}
        >
          <div className="container mx-auto px-6 relative z-10">
            <ScrollReveal direction="scale" className="max-w-4xl mx-auto">
              <div className="relative z-10">
                <ScrollReveal direction="fade" delay={0.2} className="text-center mb-16">
                  <h2
                    id="contact-heading"
                    className="text-4xl md:text-6xl font-bold font-display mb-6 tracking-tighter"
                  >
                    {t.contactTitle}
                  </h2>
                  <p className="text-gray-400 text-xl font-light">{t.contactSub}</p>
                </ScrollReveal>
                <WebdesignContactForm onSuccess={() => navigate('/')} lang={lang} />
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Related Links Section */}
        <section
          id="related-links"
          className="py-12 sm:py-20 bg-slate-950/30"
          aria-labelledby="related-links-heading"
        >
          <div className="container mx-auto px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto text-center"
            >
              <h2
                id="related-links-heading"
                className="text-3xl font-bold font-display mb-10 tracking-tight text-white/80"
              >
                {t.relatedTitle}
              </h2>
              <p className="text-gray-400 mb-8">Entdecken Sie unsere anderen Angebote</p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Button
                  onClick={() => navigate(ROUTES.VOICE_AGENTS)}
                  variant="outline"
                  className="min-h-[56px] px-8 text-white border-white/10 hover:border-white/20 hover:bg-white/5 backdrop-blur-sm transition-all"
                  aria-label="Zu Voice Agents navigieren"
                >
                  <span className="flex items-center gap-2">
                    <Zap size={18} className="text-yellow-500" />
                    Voice Agents
                  </span>
                </Button>
                <Button
                  onClick={() => navigate(ROUTES.DASHBOARD)}
                  variant="outline"
                  className="min-h-[56px] px-8 text-white border-white/10 hover:border-white/20 hover:bg-white/5 backdrop-blur-sm transition-all"
                  aria-label="Zum Dashboard navigieren"
                >
                  <span className="flex items-center gap-2">
                    <Layout size={18} className="text-blue-500" />
                    Dashboard
                  </span>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
      <WebdesignInquiryWidget lang={lang} />
    </div>
  );
};
