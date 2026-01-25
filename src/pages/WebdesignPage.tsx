import React, { useMemo, useCallback, useState, useEffect, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Navbar } from '../components/Navbar';
import {
  WebdesignContactForm,
  PricingCard,
  WebdesignAnimatedBackground,
  SplashCursorBackground,
  WebdesignHero,
  WebdesignInquiryWidget,
  BlurText,
  AntigravityBackground,
  SocialProofSection,
} from '../components/webdesign';
// ScrollReveal is kept for backward compatibility but replaced with React Bits components where possible
import {
  AuroraBackground,
  SilkBackground,
  DarkVeilBackground,
  DitherBackground,
  LazyBackground,
  AnimatedContent,
  FadeContent,
  GlareHover,
  GradientText,
  ShinyText,
  Noise,
  ShapeBlur,
} from '../components/webdesign/react-bits';
import { SkeletonLoader } from '../components/webdesign/SkeletonLoader';
import { TableOfContents } from '../components/webdesign/TableOfContents';
import { BackToTop } from '../components/webdesign/BackToTop';
import { MobileNavigation } from '../components/webdesign/MobileNavigation';
import { FloatingActionButton } from '../components/webdesign/FloatingActionButton';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useContentOptimization } from '../hooks/useContentOptimization';

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
  Home,
  DollarSign,
  Mail,
  Sparkles,
  X,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Footer } from '../components/Footer';
import { ROUTES } from '../config/navigation';

interface Feature {
  // Icon type definition for Lucide v0.4+
  icon: React.ElementType;
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
  
  // State to track dictionary overrides (for optimized content)
  const [dictionaryOverrides, setDictionaryOverrides] = useState<Partial<typeof DICTIONARY>>(() => {
    // Load saved overrides from localStorage
    if (typeof window === 'undefined') return {};
    try {
      const saved = globalThis.localStorage.getItem('webdesign-dictionary-overrides');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Merge base dictionary with overrides
  const t = useMemo(() => {
    const base = DICTIONARY[lang];
    const overrides = dictionaryOverrides[lang] || {};
    return { ...base, ...overrides };
  }, [lang, dictionaryOverrides]);

  const prefersReducedMotion = useReducedMotion();
  const { optimizeContent, loading: isOptimizing, error: optimizationError } = useContentOptimization();
  const [showOptimization, setShowOptimization] = useState(false);
  const [optimizedText, setOptimizedText] = useState<string | null>(null);
  const [originalText, setOriginalText] = useState<string | null>(null);
  const [optimizingField, setOptimizingField] = useState<string | null>(null);
  const [optimizationHint, setOptimizationHint] = useState<string | null>(null);

  // Handle content optimization
  const handleOptimizeHero = useCallback(async () => {
    const currentHeroSub = t.heroSub;
    const baseHeroSub = DICTIONARY[lang].heroSub; // Get original from base dictionary
    setOptimizingField('heroSub');
    setOriginalText(baseHeroSub); // Store original for comparison
    setOptimizedText(null); // Clear previous result
    
    const result = await optimizeContent({
      currentContent: currentHeroSub,
      context: {
        pageType: 'landing-page',
        section: 'hero',
        targetAudience: 'Swiss SMEs',
        goal: 'conversion',
      },
      language: lang === 'de' ? 'de-CH' : 'en',
    });

    if (result?.optimizedContent) {
      setOptimizedText(result.optimizedContent);
      setShowOptimization(true);
    } else if (optimizationError) {
      // Show modal even on error to display the error message
      setShowOptimization(true);
    }
    setOptimizingField(null);
  }, [optimizeContent, t.heroSub, lang, optimizationError]);

  // Handle accepting optimized content
  const handleAcceptOptimization = useCallback(() => {
    if (!optimizedText || !optimizingField) return;

    // Update dictionary overrides
    setDictionaryOverrides((prev) => {
      const newOverrides = {
        ...prev,
        [lang]: {
          ...prev[lang],
          [optimizingField]: optimizedText,
        },
      };

      // Save to localStorage
      if (typeof window !== 'undefined') {
        try {
          globalThis.localStorage.setItem('webdesign-dictionary-overrides', JSON.stringify(newOverrides));
        } catch (err) {
          console.error('Failed to save dictionary overrides:', err);
        }
      }

      return newOverrides;
    });

    setShowOptimization(false);
    setOptimizedText(null);
    setOriginalText(null);
    setOptimizingField(null);
  }, [optimizedText, optimizingField, lang]);

  // Persist language preference
  const handleLangChange = useCallback((newLang: 'de' | 'en') => {
    setLang(newLang);
    globalThis.localStorage.setItem('webdesign-lang', newLang);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const params = new URLSearchParams(window.location.search);
    if (params.get('lang') === 'en') {
      handleLangChange('en');
      return;
    }
    
    // Load language preference from localStorage
    const savedLang = globalThis.localStorage.getItem('webdesign-lang') as 'de' | 'en' | null;
    if (savedLang && (savedLang === 'de' || savedLang === 'en')) {
      handleLangChange(savedLang);
    }
  }, [handleLangChange]);

  // Keyboard shortcuts for language switching
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+D for German, Alt+E for English
      if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        if (e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          handleLangChange('de');
        } else if (e.key === 'e' || e.key === 'E') {
          e.preventDefault();
          handleLangChange('en');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleLangChange]);

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
    <div className="min-h-screen text-white selection:bg-swiss-red/30 overflow-x-hidden selection:text-white relative">
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
        <button
          onClick={handleOptimizeHero}
          disabled={isOptimizing}
          className="px-3 py-1 rounded-full text-xs font-mono border transition-all focus-visible:ring-2 focus-visible:ring-swiss-red focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 min-h-[44px] bg-slate-900/50 border-white/10 text-gray-400 hover:border-white/30 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Optimize content"
          title="Optimize hero content with AI"
        >
          <Sparkles className={`w-4 h-4 ${isOptimizing ? 'animate-spin' : ''}`} />
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => handleLangChange('de')}
            className={`px-3 py-1 rounded-full text-xs font-mono border transition-all focus-visible:ring-2 focus-visible:ring-swiss-red focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 min-h-[44px] min-w-[44px] ${lang === 'de' ? 'bg-swiss-red border-swiss-red text-white shadow-[0_0_15px_rgba(218,41,28,0.4)]' : 'bg-slate-900/50 border-white/10 text-gray-400 hover:border-white/30'}`}
            aria-label="Switch to German"
            aria-pressed={lang === 'de' ? 'true' : 'false'}
            title="Switch to German (Alt+D)"
          >
            DE
          </button>
          <button
            onClick={() => handleLangChange('en')}
            className={`px-3 py-1 rounded-full text-xs font-mono border transition-all focus-visible:ring-2 focus-visible:ring-swiss-red focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 min-h-[44px] min-w-[44px] ${lang === 'en' ? 'bg-swiss-red border-swiss-red text-white shadow-[0_0_15px_rgba(218,41,28,0.4)]' : 'bg-slate-900/50 border-white/10 text-gray-400 hover:border-white/30'}`}
            aria-label="Switch to English"
            aria-pressed={lang === 'en' ? 'true' : 'false'}
            title="Switch to English (Alt+E)"
          >
            EN
          </button>
        </div>
      </div>

      {/* Optimization Modal */}
      {showOptimization && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-lg p-6 max-w-2xl w-full shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Optimized Content</h3>
              <button
                onClick={() => {
                  setShowOptimization(false);
                  setOptimizedText(null);
                }}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {optimizationError && (
              <div className="mb-4 space-y-2">
                <div className="p-3 bg-red-900/20 border border-red-500/50 rounded text-red-400 text-sm">
                  {optimizationError}
                </div>
                {optimizationHint && (
                  <div className="p-3 bg-yellow-900/20 border border-yellow-500/50 rounded text-yellow-400 text-sm">
                    <strong>Hinweis:</strong> {optimizationHint}
                  </div>
                )}
              </div>
            )}
            {optimizedText && originalText && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400 mb-2">Original:</p>
                  <p className="text-gray-300 bg-slate-800/50 p-3 rounded">{originalText}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-2">Current:</p>
                  <p className="text-gray-400 bg-slate-800/30 p-3 rounded text-sm italic">
                    {t.heroSub !== originalText ? t.heroSub : '(same as original)'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-2">Optimized:</p>
                  <p className="text-white bg-slate-800/50 p-3 rounded">{optimizedText}</p>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleAcceptOptimization}
                    className="bg-swiss-red hover:bg-red-600"
                  >
                    Use This Version
                  </Button>
                  <Button
                    onClick={() => {
                      setShowOptimization(false);
                      setOptimizedText(null);
                      setOriginalText(null);
                      setOptimizingField(null);
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Premium Scroll Progress */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-swiss-red via-red-500 to-swiss-red z-[100] origin-left shadow-[0_0_20px_rgba(218,41,28,0.5)]"
        style={prefersReducedMotion ? {} : { scaleX }}
        aria-hidden="true"
      />

      {/* Skip Links for Keyboard Navigation */}
      <a
        href="#main-content"
        className="skip-link"
        aria-label={t.skipToContent}
      >
        {t.skipToContent}
      </a>
      <a
        href="#pricing"
        className="skip-link"
        style={{ top: '-40px', left: '120px' }}
        aria-label="Skip to pricing section"
      >
        {lang === 'de' ? 'Zu Preisen springen' : 'Skip to pricing'}
      </a>
      <a
        href="#contact-form"
        className="skip-link"
        style={{ top: '-40px', left: '280px' }}
        aria-label="Skip to contact form"
      >
        {lang === 'de' ? 'Zum Kontaktformular' : 'Skip to contact'}
      </a>

      {/* Global Seamless Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* SplashCursor Background Effect - Only on Webdesign Page - Above other backgrounds */}
        <div className="absolute inset-0 z-[1]">
          <SplashCursorBackground />
        </div>
        {/* React Bits Aurora Background for Hero Section */}
        <LazyBackground className="absolute inset-0 z-[0]">
          <AuroraBackground className="absolute inset-0" />
        </LazyBackground>
        {/* Fallback to original background if React Bits not available */}
        <WebdesignAnimatedBackground variant="hero" intensity="medium" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/2 via-slate-950/15 to-slate-950 z-[2]" />
        {/* Noise overlay for texture */}
        <Noise intensity={0.03} speed={2} className="z-[3]" />
      </div>

      <Navbar />

      {/* Table of Contents - Desktop Only */}
      <TableOfContents
        sections={[
          { id: 'hero', title: lang === 'de' ? 'Start' : 'Hero', level: 1 },
          { id: 'process-flow', title: lang === 'de' ? 'Prozess' : 'Process', level: 1 },
          { id: 'pricing', title: lang === 'de' ? 'Preise' : 'Pricing', level: 1 },
          { id: 'features', title: lang === 'de' ? 'Features' : 'Features', level: 1 },
          { id: 'technologies', title: lang === 'de' ? 'Technologien' : 'Technologies', level: 1 },
          { id: 'contact-form', title: lang === 'de' ? 'Kontakt' : 'Contact', level: 1 },
        ]}
      />

      {/* Mobile Navigation */}
      <MobileNavigation
        items={[
          { id: 'hero', label: lang === 'de' ? 'Start' : 'Home', icon: Home },
          { id: 'pricing', label: lang === 'de' ? 'Preise' : 'Pricing', icon: DollarSign },
          { id: 'features', label: lang === 'de' ? 'Features' : 'Features', icon: Zap },
          { id: 'technologies', label: lang === 'de' ? 'Tech' : 'Tech', icon: Code },
          { id: 'contact-form', label: lang === 'de' ? 'Kontakt' : 'Contact', icon: Mail },
        ]}
      />

      {/* Floating Action Button for Contact */}
      <FloatingActionButton
        onClick={() => {
          document.getElementById('contact-form')?.scrollIntoView({ 
            behavior: prefersReducedMotion ? 'auto' : 'smooth' 
          });
        }}
        label={lang === 'de' ? 'Kontakt' : 'Contact'}
      />

      <main id="main-content" className="relative z-20">
        {/* Hero Section */}
        <section
          id="hero"
          className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 sm:pt-24 md:pt-32 pb-12 sm:pb-16 md:pb-20 scroll-mt-20"
          aria-labelledby="hero-heading"
        >
          <ErrorBoundary fallback={<WebdesignHero t={t} />}>
            <WebdesignHero t={t} />
          </ErrorBoundary>
        </section>

        {/* Social Proof / Key Benefits Section */}
        <SocialProofSection lang={lang} />

        {/* Process Flow Section */}
        <Suspense fallback={<SkeletonLoader variant="process" />}>
          <WebdesignProcessFlow lang={lang} />
        </Suspense>

        {/* Portfolio / Website Previews Section */}
        <Suspense fallback={<SkeletonLoader variant="preview" />}>
          <WebsitePreviews lang={lang} />
        </Suspense>

        {/* Pricing Section */}
        <section
          id="pricing"
          className="py-12 sm:py-20 relative overflow-hidden scroll-mt-20"
          aria-labelledby="pricing-heading"
        >
          {/* React Bits DarkVeil Background for Pricing Section */}
          <LazyBackground className="absolute inset-0 z-0">
            <DarkVeilBackground className="absolute inset-0" />
          </LazyBackground>
          <div className="container mx-auto px-6 relative z-20">
            <AnimatedContent direction="up" delay={0.1} className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <h2
                  id="pricing-heading"
                  className="text-4xl md:text-6xl font-bold font-display mb-6 tracking-tight"
                >
                  <GradientText colors={['#ffffff', '#DA291C', '#ffffff']} speed={4}>
                    {t.pricingTitle}
                  </GradientText>
                </h2>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto font-light">{t.pricingSub}</p>
              </div>

              <PricingCard
                price="599 CHF"
                subtitle={t.pricingSubtitle}
                disclaimer={t.pricingDisclaimer}
                features={pricingFeatures}
              />
            </AnimatedContent>
          </div>
        </section>

        {/* Features Section - Bento Grid Layout */}
        <section
          id="features"
          className="py-16 sm:py-24 md:py-32 relative overflow-hidden scroll-mt-20"
          aria-labelledby="features-heading"
        >
          {/* React Bits Silk Background for Features Section */}
          <LazyBackground className="absolute inset-0 z-0">
            <SilkBackground className="absolute inset-0" />
          </LazyBackground>
          {/* Antigravity Background Effect */}
          {!prefersReducedMotion && (
            <div className="absolute inset-0 z-[1]">
              <AntigravityBackground
                count={200}
                color="#DA291C"
                magnetRadius={8}
                ringRadius={8}
                waveSpeed={0.3}
                particleSize={1.5}
                autoAnimate={true}
                particleShape="capsule"
              />
            </div>
          )}
          {/* Background Decorative Elements */}
          <div className="absolute top-1/2 left-0 w-96 h-96 bg-swiss-red/5 blur-[120px] rounded-full pointer-events-none z-0" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none z-0" />

          <div className="container mx-auto px-4 sm:px-6 relative z-20 max-w-7xl">
            <AnimatedContent direction="up" className="text-center mb-12 sm:mb-16 md:mb-20">
              <div className="mb-6 sm:mb-8">
                <BlurText
                  text={t.featuresTitle}
                  animateBy="words"
                  direction="top"
                  delay={100}
                  stepDuration={0.3}
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-display tracking-tight"
                />
              </div>
              <p className="text-gray-400 text-lg sm:text-xl max-w-3xl mx-auto font-light leading-relaxed px-4">
                {t.featuresSub}
              </p>
            </AnimatedContent>

            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6 max-w-7xl mx-auto">
              {/* Responsive Design - Large Item */}
              <AnimatedContent direction="up" delay={0.1} className="md:col-span-4 lg:col-span-3">
                <ShapeBlur intensity={0.2}>
                  <GlareHover intensity={0.2}>
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
                  </GlareHover>
                </ShapeBlur>
              </AnimatedContent>

              {/* Performance - Tall Item */}
              <AnimatedContent direction="up" delay={0.2} className="md:col-span-2 lg:col-span-3">
                <GlareHover intensity={0.2}>
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
                </GlareHover>
              </AnimatedContent>

              {/* SEO - Small Item */}
              <AnimatedContent direction="up" delay={0.3} className="md:col-span-2 lg:col-span-2">
                <GlareHover intensity={0.15}>
                  <div className="h-full p-8 rounded-[2rem] bg-slate-900/40 backdrop-blur-xl border border-white/5 hover:border-white/20 transition-all group">
                  <div className="p-3 w-fit rounded-xl bg-white/5 border border-white/10 group-hover:bg-purple-500/10 group-hover:border-purple-500/20 transition-colors mb-6">
                    <Search className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{features[2].title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed font-light">
                    {features[2].description}
                  </p>
                  </div>
                </GlareHover>
              </AnimatedContent>

              {/* Modern Design - Small Item */}
              <AnimatedContent direction="up" delay={0.4} className="md:col-span-2 lg:col-span-2">
                <GlareHover intensity={0.15}>
                  <div className="h-full p-8 rounded-[2rem] bg-slate-900/40 backdrop-blur-xl border border-white/5 hover:border-white/20 transition-all group">
                  <div className="p-3 w-fit rounded-xl bg-white/5 border border-white/10 group-hover:bg-blue-500/10 group-hover:border-blue-500/20 transition-colors mb-6">
                    <Palette className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{features[3].title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed font-light">
                    {features[3].description}
                  </p>
                  </div>
                </GlareHover>
              </AnimatedContent>

              {/* Security - Small Item */}
              <AnimatedContent direction="up" delay={0.5} className="md:col-span-4 lg:col-span-2">
                <GlareHover intensity={0.15}>
                  <div className="h-full p-8 rounded-[2rem] bg-slate-900/40 backdrop-blur-xl border border-white/5 hover:border-white/20 transition-all group">
                  <div className="p-3 w-fit rounded-xl bg-white/5 border border-white/10 group-hover:bg-swiss-red/10 group-hover:border-swiss-red/20 transition-colors mb-6">
                    <Shield className="w-6 h-6 text-swiss-red" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{features[6].title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed font-light">
                    {features[6].description}
                  </p>
                  </div>
                </GlareHover>
              </AnimatedContent>
            </div>
          </div>
        </section>

        {/* Technologies Section */}
        <section className="relative overflow-hidden">
          {/* React Bits Dither Background for Tech Stack Section */}
          <LazyBackground className="absolute inset-0 z-0">
            <DitherBackground className="absolute inset-0" />
          </LazyBackground>
          <Suspense fallback={<SkeletonLoader variant="tech" />}>
            <WebdesignTechStack lang={lang} />
          </Suspense>
        </section>

        {/* Contact Form Section */}
        <section
          id="contact-form"
          className="py-12 sm:py-16 md:py-20 relative overflow-hidden scroll-mt-20"
          aria-labelledby="contact-heading"
          tabIndex={-1}
        >
          <div className="container mx-auto px-4 sm:px-6 relative z-20 max-w-7xl">
            <AnimatedContent direction="up" distance={30} className="max-w-4xl mx-auto">
              <div className="relative z-10">
                <FadeContent delay={0.2} className="text-center mb-12 sm:mb-16">
                  <h2
                    id="contact-heading"
                    className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-display mb-4 sm:mb-6 tracking-tighter"
                  >
                    <ShinyText speed={3}>
                      {t.contactTitle}
                    </ShinyText>
                  </h2>
                  <p className="text-gray-400 text-lg sm:text-xl font-light px-4">{t.contactSub}</p>
                </FadeContent>
                <WebdesignContactForm onSuccess={() => navigate('/')} lang={lang} />
              </div>
            </AnimatedContent>
          </div>
        </section>

        {/* Related Links Section */}
        <section
          id="related-links"
          className="py-8 sm:py-12 relative overflow-hidden scroll-mt-20"
          aria-labelledby="related-links-heading"
        >
          <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-7xl">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto text-center"
            >
              <h2
                id="related-links-heading"
                className="text-2xl sm:text-3xl font-bold font-display mb-6 sm:mb-10 tracking-tight text-white/80"
              >
                {t.relatedTitle}
              </h2>
              <p className="text-gray-400 mb-6 sm:mb-8 text-sm sm:text-base px-4">Entdecken Sie unsere anderen Angebote</p>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
                <motion.div
                  whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                  whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  <Button
                    onClick={() => navigate(ROUTES.VOICE_AGENTS)}
                    variant="outline"
                    className="min-h-[56px] px-6 sm:px-8 text-white border-white/10 hover:border-white/20 hover:bg-white/5 backdrop-blur-sm transition-all duration-300"
                    aria-label="Zu Voice Agents navigieren"
                  >
                    <span className="flex items-center gap-2">
                      <Zap size={18} className="text-yellow-500" />
                      Voice Agents
                    </span>
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                  whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  <Button
                    onClick={() => navigate(ROUTES.DASHBOARD)}
                    variant="outline"
                    className="min-h-[56px] px-6 sm:px-8 text-white border-white/10 hover:border-white/20 hover:bg-white/5 backdrop-blur-sm transition-all duration-300"
                    aria-label="Zum Dashboard navigieren"
                  >
                    <span className="flex items-center gap-2">
                      <Layout size={18} className="text-blue-500" />
                      Dashboard
                    </span>
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
      <WebdesignInquiryWidget lang={lang} />
      <BackToTop />
    </div>
  );
};
