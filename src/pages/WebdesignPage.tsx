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
  Zap,
  Search,
  Palette,
  Code,
  Smartphone,
  Shield,
  ArrowRight,
  Layout,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Footer } from '../components/Footer';
import { ROUTES } from '../config/navigation';

interface Feature {
  icon: React.ElementType; // Changed from LucideIcon to React.ElementType for broader compatibility
  title: string;
  description: string;
}

const DICTIONARY = {
  de: {
    heroText1: 'Premium Websites für',
    heroText2: 'Schweizer KMU',
    heroSub:
      'Ihre digitale Visitenkarte: High-End Design, blitzschnelle Performance und maximale Konversion. Made in Switzerland für höchste Ansprüche.',
    missionStart: 'Kostenlose Erstberatung buchen',
    showSpecs: 'Technik-Check',
    closeSpecs: 'Analyse schließen',
    pricingTitle: 'Transparente Preisgestaltung',
    pricingSub: 'Alles inklusive – keine versteckten Kosten, keine Überraschungen',
    pricingInvest: 'Investition',
    pricingSubtitle: 'Einmalig - Alles inklusive',
    pricingDisclaimer: 'Anzahlung nur 100 CHF • Maximale Sicherheit',
    featuresTitle: 'Performance & Design',
    featuresSub: 'Modernste Webtechnologien, die Ihre Konkurrenz alt aussehen lassen.',
    processTitle: 'In 5 Schritten zum Launch',
    processSub: 'Effizient, transparent und auf Ihr Business zugeschnitten.',
    technologiesTitle: 'Tech-Stack der Extraklasse',
    technologiesSub: 'Wir bauen auf stabile, zukunftssichere Technologien.',
    contactTitle: 'Projekt anfragen',
    contactSub: 'Lassen Sie uns gemeinsam etwas Grossartiges schaffen.',
    relatedTitle: 'Weitere Services',
    skipToContent: 'Zum Hauptinhalt springen',
    scrollExplore: 'Scrollen zum Entdecken',
  },
  en: {
    heroText1: 'Premium Websites for',
    heroText2: 'Swiss SMEs',
    heroSub:
      'Your digital storefront: High-end design, lightning-fast performance, and maximum conversion. Swiss-made quality for the highest demands.',
    missionStart: 'Book Free Consultation',
    showSpecs: 'Tech Check',
    closeSpecs: 'Close Analysis',
    pricingTitle: 'Transparent Pricing',
    pricingSub: 'All inclusive – no hidden costs, no surprises',
    pricingInvest: 'Investment',
    pricingSubtitle: 'One-time - All inclusive',
    pricingDisclaimer: 'Only 100 CHF Deposit • Maximum Security',
    featuresTitle: 'Performance & Design',
    featuresSub: 'State-of-the-art web technologies that leave your competition behind.',
    processTitle: '5 Steps to Launch',
    processSub: 'Efficient, transparent, and tailored to your business.',
    technologiesTitle: 'World-Class Tech Stack',
    technologiesSub: 'We build on stable, future-proof technologies.',
    contactTitle: 'Request Project',
    contactSub: 'Let’s create something great together.',
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

  // Removed unused technologies variable to fix lint error
  // const technologies = useMemo<Technology[]>(
  //   () => [
  //     { name: 'React', description: 'Moderne Frontend-Bibliothek' },
  //     { name: 'TypeScript', description: 'Typsichere Entwicklung' },
  //     { name: 'Tailwind CSS', description: 'Utility-First CSS Framework' },
  //     { name: 'Vite', description: 'Schneller Build-Tool' },
  //     { name: 'Responsive Design', description: 'Mobile-First Ansatz' },
  //     { name: 'SEO-Optimiert', description: 'Suchmaschinen-freundlich' },
  //   ],
  //   [],
  // );

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
      <div className="fixed top-24 right-4 md:right-8 z-[100] flex items-center gap-3">
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
        <section
          id="hero"
          className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 sm:pt-32 pb-12 sm:pb-20"
        >
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
                <p className="text-gray-400 text-lg max-w-2xl mx-auto font-light">{t.pricingSub}</p>
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

        {/* Process Flow Section - Enhanced 5-Step Version */}
        <Suspense fallback={<div className="h-96 bg-slate-900/50 animate-pulse" />}>
          <WebdesignProcessFlow lang={lang} />
        </Suspense>

        {/* Features Section - Bento Grid Layout */}
        <section
          id="features"
          className="py-24 sm:py-32 bg-slate-950/30 relative overflow-hidden"
          aria-labelledby="features-heading"
        >
          {/* Background Decorative Elements */}
          <div className="absolute top-1/2 left-0 w-96 h-96 bg-swiss-red/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

          <div className="container mx-auto px-6 relative z-10">
            <ScrollReveal direction="up" className="text-center mb-20">
              <h2
                id="features-heading"
                className="text-5xl md:text-7xl font-bold font-display mb-8 tracking-tight"
              >
                {t.featuresTitle}
              </h2>
              <p className="text-gray-400 text-xl max-w-3xl mx-auto font-light leading-relaxed">
                {t.featuresSub}
              </p>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6 max-w-7xl mx-auto">
              {/* Responsive Design - Large Item */}
              <ScrollReveal direction="up" delay={0.1} className="md:col-span-4 lg:col-span-3">
                <div className="h-full p-8 sm:p-10 rounded-[2.5rem] bg-slate-900/40 backdrop-blur-xl border border-white/5 hover:border-white/20 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Globe size={120} className="text-white" />
                  </div>
                  <div className="relative z-10 h-full flex flex-col">
                    <div className="p-4 w-fit rounded-2xl bg-white/5 border border-white/10 group-hover:bg-swiss-red/10 group-hover:border-swiss-red/20 transition-colors mb-8">
                      <Globe className="w-8 h-8 text-swiss-red" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-4 tracking-tight">
                      {features[0].title}
                    </h3>
                    <p className="text-gray-400 text-lg leading-relaxed font-light mb-8">
                      {features[0].description}
                    </p>
                    <div className="mt-auto flex items-center gap-2 text-swiss-red font-mono text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
                      <span>Live Preview</span>
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              {/* Performance - Tall Item */}
              <ScrollReveal direction="up" delay={0.2} className="md:col-span-2 lg:col-span-3">
                <div className="h-full p-8 sm:p-10 rounded-[2.5rem] bg-gradient-to-br from-slate-900/60 to-slate-950/40 backdrop-blur-xl border border-white/5 hover:border-white/20 transition-all group relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="p-4 w-fit rounded-2xl bg-white/5 border border-white/10 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20 transition-colors mb-8">
                      <Zap className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-4 tracking-tight">
                      {features[1].title}
                    </h3>
                    <p className="text-gray-400 text-lg leading-relaxed font-light">
                      {features[1].description}
                    </p>

                    {/* Performance Visual */}
                    <div className="mt-12 space-y-4">
                      <div className="flex justify-between text-xs font-mono text-white/40 uppercase tracking-widest">
                        <span>Lighthouse Score</span>
                        <span className="text-emerald-400">99/100</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                          initial={{ width: 0 }}
                          whileInView={{ width: '99%' }}
                          transition={{ duration: 1.5, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              {/* SEO - Small Item */}
              <ScrollReveal direction="up" delay={0.3} className="md:col-span-2 lg:col-span-2">
                <div className="h-full p-8 rounded-[2rem] bg-slate-900/40 backdrop-blur-xl border border-white/5 hover:border-white/20 transition-all group">
                  <div className="p-3 w-fit rounded-xl bg-white/5 border border-white/10 group-hover:bg-purple-500/10 group-hover:border-purple-500/20 transition-colors mb-6">
                    <Search className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{features[2].title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed font-light">
                    {features[2].description}
                  </p>
                </div>
              </ScrollReveal>

              {/* Modern Design - Small Item */}
              <ScrollReveal direction="up" delay={0.4} className="md:col-span-2 lg:col-span-2">
                <div className="h-full p-8 rounded-[2rem] bg-slate-900/40 backdrop-blur-xl border border-white/5 hover:border-white/20 transition-all group">
                  <div className="p-3 w-fit rounded-xl bg-white/5 border border-white/10 group-hover:bg-blue-500/10 group-hover:border-blue-500/20 transition-colors mb-6">
                    <Palette className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{features[3].title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed font-light">
                    {features[3].description}
                  </p>
                </div>
              </ScrollReveal>

              {/* Security - Small Item */}
              <ScrollReveal direction="up" delay={0.5} className="md:col-span-4 lg:col-span-2">
                <div className="h-full p-8 rounded-[2rem] bg-slate-900/40 backdrop-blur-xl border border-white/5 hover:border-white/20 transition-all group">
                  <div className="p-3 w-fit rounded-xl bg-white/5 border border-white/10 group-hover:bg-swiss-red/10 group-hover:border-swiss-red/20 transition-colors mb-6">
                    <Shield className="w-6 h-6 text-swiss-red" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{features[6].title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed font-light">
                    {features[6].description}
                  </p>
                </div>
              </ScrollReveal>
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
