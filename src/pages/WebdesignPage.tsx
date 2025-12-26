import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Navbar } from '../components/Navbar';
import { useState, useEffect, Suspense, lazy } from 'react';
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
  WebdesignTechStack,
  WebdesignArchitecture,
  WebdesignComparison,
  ScrollReveal,
  Parallax,
  WebdesignHero,
  WebdesignInquiryWidget,
  FaqSection,
  TestimonialSection
} from '../components/webdesign';
import { ErrorBoundary } from '../components/ErrorBoundary';


const HeroUltraAnimation = React.lazy(() => import('../components/webdesign/hero/HeroUltraAnimation'));
import { Globe, Smartphone, Zap, Search, Palette, Code, Shield, Clock, TrendingUp, LucideIcon, ArrowLeft, ArrowRight, Layout } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/ui/ThemeToggle';
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

const DICTIONARY = {
  de: {
    heroTitle: "Digital Genesis",
    heroText1: "Digital",
    heroText2: "Genesis",
    heroSub: "Wir transformieren Konzepte in digitale Dominanz. Exzellenz ist kein Zufall, sondern Code.",
    missionStart: "Mission Starten",
    showSpecs: "Systemdaten ansehen",
    closeSpecs: "Analyse schließen",
    pricingTitle: "Transparente Festpreise",
    pricingSub: "Premium-Webdesign muss nicht kompliziert sein. Wir bieten klare Strukturen ohne monatliche Folgekosten.",
    pricingInvest: "Investition",
    pricingSubtitle: "Einmalig - Alles inklusive",
    pricingDisclaimer: "Keine monatlichen Gebühren • Keine versteckten Kosten",
    featuresTitle: "High-End Standards",
    featuresSub: "Wir setzen auf modernste Architektur für maximale Skalierbarkeit und Geschwindigkeit.",
    contactTitle: "Initialisierung",
    contactSub: "Bereit für den digitalen Aufstieg? Starten wir die Kollaboration.",
    relatedTitle: "Weitere Ecosysteme",
    skipToContent: "Zum Hauptinhalt springen",
    scrollExplore: "Scrollen zum Entdecken",
  },
  en: {
    heroTitle: "Digital Genesis",
    heroText1: "Digital",
    heroText2: "Genesis",
    heroSub: "We transform concepts into digital dominance. Excellence is not a coincidence, it is code.",
    missionStart: "Start Mission",
    showSpecs: "View System Data",
    closeSpecs: "Close Analysis",
    pricingTitle: "Transparent Fixed Prices",
    pricingSub: "Premium web design shouldn't be complicated. We offer clear structures without monthly recurring costs.",
    pricingInvest: "Investment",
    pricingSubtitle: "One-time - All inclusive",
    pricingDisclaimer: "No monthly fees • No hidden costs",
    featuresTitle: "High-End Standards",
    featuresSub: "We rely on state-of-the-art architecture for maximum scalability and speed.",
    contactTitle: "Initialization",
    contactSub: "Ready for digital ascent? Let's start the collaboration.",
    relatedTitle: "Other Ecosystems",
    skipToContent: "Skip to main content",
    scrollExplore: "Scroll to Explore",
  }
};

export const WebdesignPage = () => {
  const navigate = useNavigate();
  const [lang, setLang] = useState<'de' | 'en'>('de');
  const t = DICTIONARY[lang];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('lang') === 'en') setLang('en');
  }, []);

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
      renderDemo: () => (
        <div className="flex items-center gap-4">
          <motion.div 
            animate={{ width: [100, 60, 100] }} 
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="h-16 border-2 border-white/20 rounded-lg bg-white/5 flex items-center justify-center"
          >
            <div className="w-4 h-4 rounded-full bg-swiss-red/40" />
          </motion.div>
          <div className="text-[10px] font-mono text-white/30 hidden sm:block">FITTING_UI_V1</div>
        </div>
      )
    },
    {
      icon: Zap,
      title: 'Schnelle Ladezeiten',
      description: 'Optimierte Performance mit Code-Splitting, Lazy Loading und modernen Build-Tools. Lighthouse Score 90+ garantiert.',
      renderDemo: () => (
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90">
            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
            <motion.circle 
              cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" 
              strokeDasharray="251"
              animate={{ strokeDashoffset: [251, 2.5, 2.5] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              className="text-emerald-500" 
            />
          </svg>
          <motion.span 
            className="absolute text-2xl font-bold font-mono text-white"
            animate={{ opacity: [0, 1, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          >99</motion.span>
        </div>
      )
    },
    {
      icon: Search,
      title: 'SEO-Optimierung',
      description: 'Meta-Tags, strukturierte Daten (Schema.org), XML-Sitemap und semantisches HTML für maximale Sichtbarkeit.',
      renderDemo: () => (
        <div className="w-full max-w-[200px] space-y-2">
           <div className="h-8 w-full bg-white/10 rounded-full px-3 flex items-center gap-2">
              <Search size={12} className="text-white/40" />
              <div className="h-1.5 w-20 bg-white/20 rounded" />
           </div>
           <motion.div 
             initial={{ opacity: 0, x: -10 }}
             whileInView={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.5 }}
             className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20"
           >
              <div className="h-1.5 w-12 bg-blue-400/60 rounded mb-1" />
              <div className="h-1 w-24 bg-white/10 rounded" />
           </motion.div>
        </div>
      )
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
    <div className="min-h-screen bg-slate-950 text-white selection:bg-swiss-red/30 overflow-x-hidden selection:text-white">
      <Helmet>
        <title>Premium Webdesign & Digital Genesis | AIDevelo</title>
        <meta name="description" content="High-End Webdesign aus der Schweiz. Wir transformieren Konzepte in digitale Dominanz mit React, TypeScript und modernster Architektur. Lighthouse Score 90+ garantiert." />
        <meta property="og:title" content="Premium Webdesign | AIDevelo" />
        <meta property="og:description" content="Exzellenz ist kein Zufall, sondern Code. Entdecken Sie High-End Webdesign für maximale Skalierbarkeit." />
        <meta property="og:type" content="website" />
        <link rel="alternate" hrefLang="de-CH" href="https://aidevelo.ai/webdesign" />
        <link rel="alternate" hrefLang="en" href="https://aidevelo.ai/en/webdesign" />
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "Product",
              "name": "High-End Webdesign Service",
              "description": "Premium Webdesign-Umsetzung in 2-3 Wochen mit Fokus auf Performance, SEO und modernster Architektur.",
              "brand": {
                "@type": "Brand",
                "name": "AIDevelo"
              },
              "offers": {
                "@type": "Offer",
                "price": "599",
                "priceCurrency": "CHF",
                "availability": "https://schema.org/InStock"
              },
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "Welches CMS nutzt AIDevelo?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Wir setzen primär auf moderne Headless-Lösungen wie Strapi oder Contentful."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Wie lange dauert eine Projektumsetzung?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Ein typisches Webdesign-Projekt dauert zwischen 4 und 8 Wochen."
                  }
                }
              ]
            }
          `}
        </script>
      </Helmet>

      {/* Language & Theme Switcher */}
      <div className="fixed top-24 right-8 z-[100] flex items-center gap-3">
        <ThemeToggle />
        <div className="flex gap-2">
          <button 
            onClick={() => setLang('de')}
            className={`px-3 py-1 rounded-full text-xs font-mono border transition-all ${lang === 'de' ? 'bg-swiss-red border-swiss-red text-white shadow-[0_0_15px_rgba(218,41,28,0.4)]' : 'bg-slate-900/50 border-white/10 text-gray-400 hover:border-white/30'}`}
            aria-label="Switch to German"
          >
            DE
          </button>
          <button 
            onClick={() => setLang('en')}
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
      
      <SmoothScroll>
        <CursorFollower />
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
        {/* Terminal Showcase (CLI aesthetic) */}
        <section className="container mx-auto px-6 py-10">
          <div className="terminal border-white/10 bg-black/60">
            <div className="terminal-header">
              <div className="ascii-title">
                <pre className="ascii-art">
{`   ___    ___   ____           _           
  / _ \  / _ \ |  _ \    ___  | |  ___  _ __ 
 | | | || | | || | | |  / _ \ | | / _ \| '__|
 | |_| || |_| || |_| | | (_) || ||  __/| |   
  \___/  \___/ |____/   \___/ |_| \___||_|   `}
                </pre>
              </div>
              <div className="terminal-subtitle">
                <span className="status-dot" aria-hidden="true"></span>
                <span className="font-mono-term">SYSTEM: online · mode: webdesign · region: CH</span>
              </div>
            </div>

            <div className="p-4 space-y-6">
              {/* Command section */}
              <div className="terminal-command">
                <div className="header-content">
                  <h2 className="search-title font-mono-term">
                    <span className="terminal-dot" aria-hidden="true"></span>
                    <strong>search</strong>
                    <span className="title-params">(query)</span>
                  </h2>
                  <p className="search-subtitle">⎿ type to filter services, pricing, or features</p>
                </div>
                <div className="terminal-search-container">
                  <div className="terminal-search-wrapper">
                    <span className="terminal-prompt">&gt;</span>
                    <input aria-label="Terminal search" type="text" className="terminal-search-input" placeholder="e.g. pricing, responsive, seo" />
                    <button className="terminal-btn" type="button">run</button>
                  </div>
                </div>
              </div>

              {/* Filter chips */}
              <div className="component-type-filters">
                <div className="filter-group">
                  <span className="filter-group-label">type:</span>
                  <div className="filter-chips">
                    <button className="filter-chip active" data-filter="feature" type="button"><span className="chip-icon">⚙️</span>feature</button>
                    <button className="filter-chip" data-filter="pricing" type="button"><span className="chip-icon">💳</span>pricing</button>
                    <button className="filter-chip" data-filter="faq" type="button"><span className="chip-icon">❓</span>faq</button>
                  </div>
                </div>
              </div>

              {/* Command-line example */}
              <div className="command-line">
                <span className="prompt">$</span>
                <code className="command">curl -X GET https://aidevelo.ai/webdesign?lang={lang}</code>
                <button
                  className="copy-btn"
                  type="button"
                  onClick={() => {
                    const cmd = `curl -X GET https://aidevelo.ai/webdesign?lang=${lang}`;
                    navigator.clipboard?.writeText(cmd);
                  }}
                  aria-label="Copy command"
                >copy</button>
              </div>
            </div>
          </div>
        </section>
        {/* Hero Section */}
        <section className="relative min-h-screen">
          <ErrorBoundary fallback={<WebdesignHero t={t} />}>
            <Suspense fallback={<WebdesignHero t={t} />}>
              <HeroUltraAnimation t={t} lang={lang} />
            </Suspense>
          </ErrorBoundary>
        </section>

        {/* Process Flow Section */}
        <ScrollReveal direction="up">
          <WebdesignProcessFlow lang={lang} />
        </ScrollReveal>

        {/* Portfolio / Website Previews Section */}
        <WebsitePreviews lang={lang} />

        {/* Tech Stack Showcase */}
        <WebdesignTechStack lang={lang} />

        {/* Architectural Deep-Dive */}
        <WebdesignArchitecture lang={lang} />

        <div className="h-48 w-px bg-gradient-to-b from-swiss-red via-swiss-red/50 to-transparent mx-auto opacity-30 my-12" />

        {/* Business Comparison Section */}
        <WebdesignComparison lang={lang} />

        {/* Pricing Section */}
        <section 
          id="pricing"
          className="py-24 sm:py-32 relative overflow-hidden"
          aria-labelledby="pricing-heading"
        >
          <div className="container mx-auto px-6 relative z-10">
            <ScrollReveal direction="up" delay={0.1} className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  className="inline-block px-4 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-gray-400 uppercase tracking-widest mb-4"
                >
                  {t.pricingInvest}
                </motion.div>
                <h2 id="pricing-heading" className="text-4xl md:text-6xl font-bold font-display mb-6 tracking-tight">
                  {lang === 'de' ? (
                    <>Transparente <span className="text-swiss-red">Festpreise</span></>
                  ) : (
                    <>Transparent <span className="text-swiss-red">Fixed Prices</span></>
                  )}
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

        {/* Features Section */}
        <section 
          id="features"
          className="py-24 sm:py-32 relative bg-white/[0.02]"
          aria-labelledby="features-heading"
        >
          <div className="container mx-auto px-6 relative z-10">
            <ScrollReveal direction="up" className="text-center mb-20">
              <h2 id="features-heading" className="text-4xl md:text-6xl font-bold font-display mb-6 tracking-tight">
                {lang === 'de' ? (
                  <>High-End <span className="text-blue-500">Standards</span></>
                ) : (
                  <>High-End <span className="text-blue-500">Standards</span></>
                )}
              </h2>
              <p className="text-gray-400 text-lg max-w-3xl mx-auto font-light">
                {t.featuresSub}
              </p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.2} className="max-w-7xl mx-auto">
              <BentoGrid features={features} lang={lang} />
            </ScrollReveal>
          </div>
        </section>


        {/* FAQ Section */}
        <FaqSection lang={lang} />

        {/* Testimonials */}
        <TestimonialSection lang={lang} />

        {/* Contact Form Section */}
        <section 
          id="contact-form"
          className="py-24 sm:py-40 relative"
          aria-labelledby="contact-heading"
          tabIndex={-1}
        >
           {/* Background Spotlights */}
           <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-swiss-red/10 rounded-full blur-[160px] pointer-events-none animate-pulse" />
           <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[160px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

          <div className="container mx-auto px-6 relative z-10">
            <ScrollReveal direction="scale" className="max-w-4xl mx-auto">
                <div className="relative z-10">
                  <ScrollReveal direction="fade" delay={0.2} className="text-center mb-16">
                    <h2 id="contact-heading" className="text-4xl md:text-6xl font-bold font-display mb-6 tracking-tighter">
                      {t.contactTitle}
                    </h2>
                    <p className="text-gray-400 text-xl font-light">
                      {t.contactSub}
                    </p>
                  </ScrollReveal>
                  <WebdesignContactForm onSuccess={() => navigate('/')} lang={lang} />
                </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Latest Insights / Blog Section */}
        <section className="py-24 relative overflow-hidden bg-slate-900/40">
           <div className="container mx-auto px-6 relative z-10">
             <div className="text-center mb-16">
                <div className="text-[10px] font-mono text-blue-400 uppercase tracking-widest mb-4">Knowledge Base</div>
                <h2 className="text-4xl font-bold font-display text-white">Latest <span className="text-blue-500">Insights</span></h2>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {[
                  {
                    title: lang === 'de' ? 'Mobile-First Design 2026' : 'Mobile-First Design 2026',
                    description: lang === 'de' ? 'Warum responsive Design nicht mehr ausreicht und wie adaptive Layouts die Zukunft prägen.' : 'Why responsive design is no longer enough and how adaptive layouts shape the future.',
                    tag: 'UX/UI'
                  },
                  {
                    title: lang === 'de' ? 'Headless CMS Performance' : 'Headless CMS Performance',
                    description: lang === 'de' ? 'Der Performance-Vergleich: Warum statische Frontends klassische Systeme wie WordPress schlagen.' : 'The performance comparison: Why static frontends beat classic systems like WordPress.',
                    tag: 'Engineering'
                  }
                ].map((article, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ y: -5 }}
                    className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-all"
                  >
                    <div className="inline-block px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-mono mb-4">{article.tag}</div>
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors uppercase tracking-tight">{article.title}</h3>
                    <p className="text-gray-400 text-sm font-light leading-relaxed mb-6">{article.description}</p>
                    <button className="text-[10px] font-mono text-white/40 group-hover:text-white transition-colors flex items-center gap-2">
                       READ_MORE // 0{i + 1}
                       <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                    </button>
                  </motion.div>
                ))}
             </div>
           </div>
        </section>

        {/* Related Links Section */}
        <section 
          id="related-links"
          className="py-24 relative overflow-hidden"
          aria-labelledby="related-links-heading"
        >
           <div className="absolute inset-0 bg-white/[0.01]" />
           <div className="container mx-auto px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto text-center"
            >
              <h2 id="related-links-heading" className="text-3xl font-bold font-display mb-10 tracking-tight text-white/80">
                {t.relatedTitle}
              </h2>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Button
                  onClick={() => navigate(ROUTES.HOME)}
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
      </SmoothScroll>
    </div>
  );
};
