import React, { useMemo, useCallback, useState, useEffect, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Navbar } from '../components/Navbar';
import {
  WebdesignContactForm,
  PricingCard,
  WebdesignAnimatedBackground,
  WebdesignHero,
  WebdesignHeroOptimized,
  WebdesignInquiryWidget,
  BlurText,
  SocialProofSection,
  SectionTransition,
  PricingComparison,
} from '../components/webdesign';

// Lazy-load heavy background effects for better LCP
const SplashCursorBackground = lazy(() =>
  import('../components/webdesign/SplashCursorBackground').then((m) => ({
    default: m.SplashCursorBackground,
  })),
) as React.LazyExoticComponent<React.FC>;

const AntigravityBackground = lazy(() =>
  import('../components/webdesign/AntigravityBackground').then((m) => ({
    default: m.AntigravityBackground,
  })),
) as React.LazyExoticComponent<React.FC<{
  count?: number;
  color?: string;
  magnetRadius?: number;
  ringRadius?: number;
  waveSpeed?: number;
  particleSize?: number;
  autoAnimate?: boolean;
  particleShape?: string;
}>>;
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
import { useMediaQuery } from '../hooks/useMediaQuery';

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

const Interactive3DShowcase = lazy(() =>
  import('../components/webdesign/Interactive3DShowcase').then((m) => ({
    default: m.Interactive3DShowcase,
  })),
) as React.LazyExoticComponent<React.FC>;

// Lazy-load hero components for better initial load performance
const HeroTrustBar = lazy(() =>
  import('../components/webdesign/HeroTrustBar').then((m) => ({
    default: m.HeroTrustBar,
  })),
) as React.LazyExoticComponent<React.FC>;

// Lazy-load TestimonialSection to avoid JSON import issues during initial load
const TestimonialSection = lazy(() =>
  import('../components/webdesign/TestimonialSection').then((m) => ({
    default: m.TestimonialSection,
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

const PRICING_FEATURES_DICTIONARY: Record<'de' | 'en', { text: string }[]> = {
  de: [
    { text: 'Bis zu 5 Seiten (Home, Über uns, Services, Kontakt, etc.) – vollständige Online-Präsenz (vs. 2000+ CHF bei Agenturen)' },
    { text: 'Responsive Design – steigert mobile Conversion um bis zu 40% (ROI: Mehr Umsatz ohne zusätzliche Werbekosten)' },
    { text: 'SEO-Optimierung – erhöht organischen Traffic um durchschnittlich 35% (spart langfristig Werbebudget)' },
    { text: 'Kontaktformular mit E-Mail-Benachrichtigung – keine Leads mehr verpassen (automatisiert, 24/7)' },
    { text: 'Social Media Integration – stärkt Ihre Markenpräsenz (konsistente Markenführung)' },
    { text: 'Lighthouse Score 99/100 – messbar schnell, besser als 95% der Konkurrenz (steigert Conversion um 20%+)' },
    { text: 'Wartbarer Code – langfristige Kosteneinsparung durch einfache Erweiterungen (50-70% günstiger als Neuentwicklung)' },
    { text: '2–3 Wochen Umsetzung – schneller Markteintritt, schneller ROI (vs. 2-4 Monate bei Agenturen)' },
  ],
  en: [
    { text: 'Up to 5 pages (Home, About, Services, Contact, etc.) – complete online presence (vs. 2000+ CHF at agencies)' },
    { text: 'Responsive design – increases mobile conversion by up to 40% (ROI: More revenue without additional ad costs)' },
    { text: 'SEO optimization – increases organic traffic by an average of 35% (saves advertising budget long-term)' },
    { text: 'Contact form with email notification – never miss a lead again (automated, 24/7)' },
    { text: 'Social media integration – strengthens your brand presence (consistent brand management)' },
    { text: 'Lighthouse Score 99/100 – measurably fast, better than 95% of competitors (increases conversion by 20%+)' },
    { text: 'Maintainable code – long-term cost savings through easy extensions (50-70% cheaper than redevelopment)' },
    { text: '2–3 weeks delivery – faster market entry, faster ROI (vs. 2-4 months at agencies)' },
  ],
};

const FEATURES_DICTIONARY: Record<'de' | 'en', Feature[]> = {
  de: [
    {
      icon: Globe,
      title: 'Responsive Design',
      description:
        'Steigert mobile Conversion um bis zu 40% durch perfekte Darstellung auf allen Geräten. Jeder Besucher erlebt optimale Nutzererfahrung – unabhängig vom Endgerät.',
    },
    {
      icon: Zap,
      title: 'Schnelle Ladezeiten',
      description:
        'Lighthouse Score 99/100 garantiert. Ladezeiten unter 2.5 Sekunden steigern Conversion um bis zu 20% und verbessern Google-Rankings messbar – Ihre Wettbewerbsvorteile.',
    },
    {
      icon: Search,
      title: 'SEO-Optimierung',
      description:
        'Schema.org, XML-Sitemap, semantisches HTML. Erhöht organischen Traffic um durchschnittlich 35% durch verbesserte Rankings – mehr qualifizierte Leads ohne Werbekosten. ROI: Jeder investierte Franken spart langfristig Werbekosten.',
    },
    {
      icon: Palette,
      title: 'Modernes Design',
      description:
        'Professionelles UI/UX nach aktuellen Standards stärkt Ihre Marke und erhöht Conversion um durchschnittlich 25%. Klare Hierarchie und starke CTAs führen Besucher gezielt zum Ziel. Vergleich: Baukasten-Templates erreichen nur 5-10% Conversion-Steigerung.',
    },
    {
      icon: Code,
      title: 'Sauberer Code',
      description:
        'TypeScript, React, Tailwind – wartbar und zukunftssicher. Sparen Sie langfristig Kosten durch einfache Erweiterungen ohne teure Neuentwicklung. Ihre Investition bleibt wertvoll. ROI: 50-70% Kosteneinsparung bei zukünftigen Updates vs. Agentur-Neuentwicklung.',
    },
    {
      icon: Smartphone,
      title: 'Mobile-First',
      description:
        'Touch-optimiert, schnelle Ladezeiten auf 4G. Erreichen Sie über 60% Ihrer Zielgruppe optimal – Ihre Website ist für den mobilen Markt perfekt vorbereitet.',
    },
    {
      icon: Shield,
      title: 'Sicherheit',
      description:
        'HTTPS, DSGVO-konform, sichere Formulare. Stärken Sie Kundenvertrauen und schützen Sie sensible Daten. Regelmäßige Updates gewährleisten langfristige Sicherheit.',
    },
  ],
  en: [
    {
      icon: Globe,
      title: 'Responsive Design',
      description:
        'Increases mobile conversion by up to 40% through perfect display on all devices. Every visitor experiences optimal user experience – regardless of device.',
    },
    {
      icon: Zap,
      title: 'Fast Load Times',
      description:
        'Lighthouse Score 99/100 guaranteed. Load times under 2.5 seconds increase conversion by up to 20% and measurably improve Google rankings – your competitive advantages.',
    },
    {
      icon: Search,
      title: 'SEO Optimization',
      description:
        'Schema.org, XML sitemap, semantic HTML. Increases organic traffic by an average of 35% through improved rankings – more qualified leads without advertising costs. ROI: Every franc invested saves long-term advertising costs.',
    },
    {
      icon: Palette,
      title: 'Modern Design',
      description:
        'Professional UI/UX to current standards strengthens your brand and increases conversion by an average of 25%. Clear hierarchy and strong CTAs guide visitors purposefully to their goal. Comparison: Template builders achieve only 5-10% conversion increase.',
    },
    {
      icon: Code,
      title: 'Clean Code',
      description:
        'TypeScript, React, Tailwind – maintainable and future-proof. Save long-term costs through easy extensions without costly redevelopment. Your investment remains valuable. ROI: 50-70% cost savings on future updates vs. agency redevelopment.',
    },
    {
      icon: Smartphone,
      title: 'Mobile-First',
      description:
        'Touch-optimized, fast load times on 4G. Reach over 60% of your target audience optimally – your website is perfectly prepared for the mobile market.',
    },
    {
      icon: Shield,
      title: 'Security',
      description:
        'HTTPS, GDPR compliant, secure forms. Strengthen customer trust and protect sensitive data. Regular updates ensure long-term security.',
    },
  ],
};

const DICTIONARY = {
  de: {
    heroText1: 'Mehr Leads durch professionelle Websites',
    heroText2: '– in 2-3 Wochen live',
    heroSub:
      'CHF 599 Festpreis • 100/100 Lighthouse Score • Made in Switzerland. Websites, die Conversion-Raten um durchschnittlich 25% erhöhen. Individuelles Design statt Templates – Ihre Marke, nicht ein Baukasten.',
    heroPrice: 'CHF 599',
    heroPriceSubtitle: 'Festpreis • Alles inklusive',
    heroComparisonHint: 'Vergleich: Agenturen verlangen CHF 2000-5000 für ähnliche Leistungen',
    heroHeadline: 'Mehr Leads durch professionelle Websites – in 2-3 Wochen live',
    heroSubheadline:
      'CHF 599 Festpreis • 100/100 Lighthouse Score • Made in Switzerland',
    heroBullets: [
      '100/100 Lighthouse-Score – messbar schneller als 95% der Konkurrenz',
      'Ladezeiten unter 1 Sekunde – steigert Conversion um bis zu 20%',
      'Individuelles Design statt Templates – Ihre Marke, nicht ein Baukasten',
      'Persönliche 1:1 Betreuung aus der Schweiz – von Strategie bis Launch',
    ],
    ctaPrimary: 'Projekt unverbindlich anfragen',
    ctaSecondary: 'Beispiele ansehen',
    missionStart: 'Kostenlose Erstberatung buchen',
    showSpecs: 'Technik-Check',
    closeSpecs: 'Analyse schließen',
    pricingTitle: 'Transparente Preisgestaltung',
    pricingSub: 'Ein Festpreis, alle Leistungen inklusive. Keine versteckten Kosten, keine Überraschungen – planen Sie Ihr Budget mit vollständiger Sicherheit. Vergleich: Agenturen verlangen 2000-5000 CHF für ähnliche Leistungen.',
    pricingInvest: 'Investition',
    pricingSubtitle: 'Einmalig – Alles inklusive',
    pricingDisclaimer: 'Nur 100 CHF Anzahlung • Sichere Zahlung • Volle Transparenz',
    featuresTitle: 'Performance & Design',
    featuresSub: 'Technologie, die messbare Geschäftsergebnisse liefert: Schnelle Ladezeiten steigern Conversion, starke SEO bringt mehr qualifizierte Leads, modernes Design stärkt Ihre Marke.',
    processTitle: 'In 5 Schritten zum Launch',
    processSub: 'Ein strukturierter Prozess für messbare Geschäftsergebnisse. Von der Strategie bis zum Launch – transparent, effizient und auf Ihr Wachstum ausgerichtet.',
    technologiesTitle: 'Bewährter Tech-Stack',
    technologiesSub: 'React, TypeScript, Tailwind – moderne Technologien für zukunftssichere Websites.',
    contactTitle: 'Projekt anfragen',
    contactSub: 'Lassen Sie uns gemeinsam Ihre digitale Strategie entwickeln. Kostenlose Erstberatung – wir melden uns innerhalb von 24 Stunden.',
    relatedTitle: 'Weitere Services',
    relatedSub: 'Entdecken Sie unsere anderen Angebote',
    skipToContent: 'Zum Hauptinhalt springen',
    scrollExplore: 'Scrollen zum Entdecken',
    heroBadgeSystems: 'SYSTEMS ONLINE & READY',
    heroBadgeSwiss: 'MADE IN SWITZERLAND',
    heroBadgePerformance: 'Performance optimiert',
    heroBadgePricing: 'Transparentes Festpreis-Modell',
    heroTrustLighthouse: '99+ Lighthouse Score',
    heroTrustLoadTime: '< 2.5s Ladezeit',
    heroTrustGdpr: 'DSGVO-konform',
  },
  en: {
    heroText1: 'More Leads Through Professional Websites',
    heroText2: '– Live in 2-3 Weeks',
    heroSub:
      'CHF 599 Fixed Price • 100/100 Lighthouse Score • Made in Switzerland. Websites that increase conversion rates by an average of 25%. Individual design instead of templates – Your brand, not a cookie-cutter.',
    heroPrice: 'CHF 599',
    heroPriceSubtitle: 'Fixed Price • All Inclusive',
    heroComparisonHint: 'Comparison: Agencies charge CHF 2000-5000 for similar services',
    heroHeadline: 'More Leads Through Professional Websites – Live in 2-3 Weeks',
    heroSubheadline:
      'CHF 599 Fixed Price • 100/100 Lighthouse Score • Made in Switzerland',
    heroBullets: [
      '100/100 Lighthouse Score – measurably faster than 95% of competitors',
      'Load Times Under 1 Second – increases conversion by up to 20%',
      'Individual Design Instead of Templates – Your brand, not a cookie-cutter',
      'Personal 1:1 Support from Switzerland – from strategy to launch',
    ],
    ctaPrimary: 'Request Project',
    ctaSecondary: 'View Examples',
    missionStart: 'Book Free Consultation',
    showSpecs: 'Tech Check',
    closeSpecs: 'Close Analysis',
    pricingTitle: 'Transparent Pricing',
    pricingSub: 'One fixed price, everything included. No hidden costs, no surprises – plan your budget with complete confidence. Comparison: Agencies charge 2000-5000 CHF for similar services.',
    pricingInvest: 'Investment',
    pricingSubtitle: 'One-time – All inclusive',
    pricingDisclaimer: 'Only 100 CHF Deposit • Secure Payment • Full Transparency',
    featuresTitle: 'Performance & Design',
    featuresSub: 'Technology that delivers measurable business results: Fast load times increase conversion, strong SEO brings more qualified leads, modern design strengthens your brand.',
    processTitle: '5 Steps to Launch',
    processSub: 'A structured process for measurable business results. From strategy to launch – transparent, efficient, and focused on your growth.',
    technologiesTitle: 'Proven Tech Stack',
    technologiesSub: 'React, TypeScript, Tailwind – modern technologies for future-proof websites.',
    contactTitle: 'Request Project',
    contactSub: 'Let us develop your digital strategy together. Free initial consultation – we will get back to you within 24 hours.',

    relatedTitle: 'Other Services',
    relatedSub: 'Explore our other services',
    skipToContent: 'Skip to main content',
    scrollExplore: 'Scroll to Explore',
    heroBadgeSystems: 'SYSTEMS ONLINE & READY',
    heroBadgeSwiss: 'MADE IN SWITZERLAND',
    heroBadgePerformance: 'Performance optimized',
    heroBadgePricing: 'Transparent fixed-price model',
    heroTrustLighthouse: '99+ Lighthouse Score',
    heroTrustLoadTime: '< 2.5s load time',
    heroTrustGdpr: 'GDPR compliant',
    heroPrice: 'CHF 599',
    heroPriceSubtitle: 'Fixed Price • All Inclusive',
    heroComparisonHint: 'Comparison: Agencies charge CHF 2000-5000 for similar services',
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
  const isMobile = useMediaQuery('(max-width: 768px)');
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
      // Escape: close optimization modal
      if (e.key === 'Escape' && showOptimization) {
        setShowOptimization(false);
        setOptimizedText(null);
        setOriginalText(null);
        setOptimizingField(null);
        return;
      }
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
  }, [handleLangChange, showOptimization]);

  const features = useMemo<Feature[]>(() => FEATURES_DICTIONARY[lang], [lang]);


  const pricingFeatures = useMemo(
    () => PRICING_FEATURES_DICTIONARY[lang],
    [lang],
  );
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <div
      className="min-h-screen text-white selection:bg-swiss-red/30 overflow-x-hidden selection:text-white relative"
      lang={lang === 'de' ? 'de-CH' : 'en'}
    >
      <Helmet>
        <title>Premium Webdesign & Elegantes Redesign | AIDevelo</title>
        <meta
          name="description"
          content="Professionelle, moderne Websites mit modernsten Technologien. Von der Konzeption bis zum Launch – alles zum transparenten Festpreis von 599 CHF."
        />
        <meta name="keywords" content="Webdesign, Website, Redesign, Schweiz, KMU, React, TypeScript, SEO, responsive" />
        <link rel="canonical" href="https://aidevelo.ai/webdesign" />
        <meta property="og:title" content="Premium Webdesign für Schweizer KMU | 100/100 Lighthouse Score" />
        <meta
          property="og:description"
          content="Websites mit 100/100 Lighthouse Score, die Conversion um 25% steigern. Individuelles Design, transparente Festpreise (599 CHF), Made in Switzerland."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://aidevelo.ai/webdesign" />
        <meta property="og:image" content="https://aidevelo.ai/og-image.png" />
        <meta property="og:locale" content={lang === 'de' ? 'de_CH' : 'en_US'} />
        <link rel="alternate" hrefLang="de-CH" href="https://aidevelo.ai/webdesign" />
        <link rel="alternate" hrefLang="en" href="https://aidevelo.ai/en/webdesign" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Premium Webdesign',
            description:
              lang === 'de'
                ? 'Premium Webdesign mit 100/100 Lighthouse Score für Schweizer KMU. Websites, die Conversion um durchschnittlich 25% steigern. Individuelles Design, transparente Festpreise, Made in Switzerland.'
                : 'Premium web design with 100/100 Lighthouse Score for Swiss SMEs. Websites that increase conversion by an average of 25%. Individual design, transparent fixed prices, Made in Switzerland.',
            provider: {
              '@type': 'Organization',
              name: 'AIDevelo',
              url: 'https://aidevelo.ai',
              logo: 'https://aidevelo.ai/logo-white.png',
              address: {
                '@type': 'PostalAddress',
                addressCountry: 'CH',
              },
            },
            areaServed: { '@type': 'Country', name: 'Switzerland' },
            offers: {
              '@type': 'Offer',
              price: '599',
              priceCurrency: 'CHF',
              availability: 'https://schema.org/InStock',
              priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '5',
              reviewCount: '10',
            },
            serviceType: 'Web Design',
            category: 'Web Development',
          })}
        </script>
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
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="optimization-modal-title"
        >
          <div
            className="bg-slate-900 border border-white/10 rounded-lg p-6 max-w-2xl w-full shadow-xl"
            tabIndex={-1}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 id="optimization-modal-title" className="text-xl font-bold text-white">
                Optimized Content
              </h3>
              <button
                onClick={() => {
                  setShowOptimization(false);
                  setOptimizedText(null);
                }}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded focus-visible:ring-2 focus-visible:ring-swiss-red focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                aria-label="Close modal"
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
        {/* SplashCursor Background Effect - Only on Webdesign Page - Above other backgrounds. Disabled on mobile for performance. */}
        {!isMobile && (
          <div className="absolute inset-0 z-[1]">
            <Suspense fallback={null}>
              <SplashCursorBackground />
            </Suspense>
          </div>
        )}
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
        {/* Optimized Hero Section with Integrated Trust Bar */}
        <Suspense fallback={<div className="min-h-screen" />}>
          <WebdesignHeroOptimized
            t={{
              heroHeadline: t.heroHeadline,
              heroSubheadline: t.heroSubheadline,
              heroComparisonHint: t.heroComparisonHint,
              ctaPrimary: t.ctaPrimary,
              ctaSecondary: t.ctaSecondary,
              phoneNumber: '+41 79 XXX XX XX', // TODO: Add actual phone number
              emailAddress: 'webdesign@aidevelo.ai', // TODO: Add actual email
              scrollExplore: t.scrollExplore,
            }}
            lang={lang}
          />
        </Suspense>

        {/* Process Flow Section */}
        <ErrorBoundary
          fallback={
            <section className="py-16 sm:py-24 md:py-32">
              <div className="container mx-auto px-4 sm:px-6 text-center">
                <p className="text-gray-400">
                  {lang === 'de'
                    ? 'Prozessübersicht wird geladen... Bei Problemen die Seite neu laden.'
                    : 'Process overview loading... Refresh the page if issues persist.'}
                </p>
              </div>
            </section>
          }
        >
          <Suspense fallback={<SkeletonLoader variant="process" />}>
            <WebdesignProcessFlow lang={lang} />
          </Suspense>
        </ErrorBoundary>

        {/* Portfolio / Website Previews Section */}
        <ErrorBoundary
          fallback={
            <section className="py-16 sm:py-24 md:py-32">
              <div className="container mx-auto px-4 sm:px-6 text-center">
                <p className="text-gray-400">
                  {lang === 'de'
                    ? 'Portfolio wird geladen... Bei Problemen die Seite neu laden.'
                    : 'Portfolio loading... Refresh the page if issues persist.'}
                </p>
              </div>
            </section>
          }
        >
          <Suspense fallback={<SkeletonLoader variant="preview" />}>
            <WebsitePreviews lang={lang} />
          </Suspense>
        </ErrorBoundary>

        {/* Pricing Section */}
        <SectionTransition variant="fade" intensity="medium">
          <section
            id="pricing"
            className="py-16 sm:py-24 md:py-32 relative overflow-hidden scroll-mt-20"
            aria-labelledby="pricing-heading"
          >
          {/* React Bits DarkVeil Background for Pricing Section */}
          <LazyBackground className="absolute inset-0 z-0">
            <DarkVeilBackground className="absolute inset-0" />
          </LazyBackground>
          <div className="container mx-auto px-4 sm:px-6 relative z-20">
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
        </SectionTransition>

        {/* Pricing Comparison Table */}
        <PricingComparison lang={lang} />

        {/* Features Section - Bento Grid Layout */}
        <SectionTransition variant="parallax" intensity="subtle">
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
              <Suspense fallback={null}>
                <AntigravityBackground
                  count={isMobile ? 60 : 200}
                  color="#DA291C"
                  magnetRadius={isMobile ? 6 : 8}
                  ringRadius={isMobile ? 6 : 8}
                  waveSpeed={0.3}
                  particleSize={isMobile ? 1 : 1.5}
                  autoAnimate={true}
                  particleShape="capsule"
                />
              </Suspense>
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
                    <div className="mt-auto flex items-center gap-2 text-swiss-red font-mono text-xs uppercase tracking-widest group-hover:gap-3 transition-all duration-300">
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
        </SectionTransition>

        {/* 3D Showcase Section */}
        {!prefersReducedMotion && !isMobile && (
          <ErrorBoundary
            fallback={
              <div className="h-[600px] w-full flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-400 mb-4">
                    Das interaktive 3D-Modul konnte nicht geladen werden. Bitte Seite neu laden oder versuche es später.
                  </p>
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 rounded bg-accent text-black"
                    >
                      Seite neu laden
                    </button>
                    <a href="#contact-form" className="px-4 py-2 rounded border border-white/10 text-gray-300 hover:text-white">
                      Support kontaktieren
                    </a>
                  </div>
                </div>
              </div>
            }
          >
             <Suspense fallback={<div className="h-[600px] w-full" />}>
               <Interactive3DShowcase />
             </Suspense>
          </ErrorBoundary>
        )}

        {/* Testimonials Section */}
        <SectionTransition variant="fade" intensity="subtle">
          <Suspense fallback={<div className="py-24" />}>
            <TestimonialSection lang={lang} />
          </Suspense>
        </SectionTransition>

        {/* Technologies Section */}
        <section className="relative overflow-hidden">
          {/* React Bits Dither Background for Tech Stack Section */}
          <LazyBackground className="absolute inset-0 z-0">
            <DitherBackground className="absolute inset-0" />
          </LazyBackground>
          <ErrorBoundary
            fallback={
              <div className="container mx-auto px-4 sm:px-6 py-16 text-center">
                <p className="text-gray-400">
                  {lang === 'de'
                    ? 'Technologie-Übersicht wird geladen... Bei Problemen die Seite neu laden.'
                    : 'Technology overview loading... Refresh the page if issues persist.'}
                </p>
              </div>
            }
          >
            <Suspense fallback={<SkeletonLoader variant="tech" />}>
              <WebdesignTechStack lang={lang} />
            </Suspense>
          </ErrorBoundary>
        </section>

        {/* Contact Form Section */}
        <section
          id="contact-form"
          className="py-16 sm:py-24 md:py-32 relative overflow-hidden scroll-mt-20"
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
          className="py-12 sm:py-16 md:py-20 relative overflow-hidden scroll-mt-20"
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
              <p className="text-gray-400 mb-6 sm:mb-8 text-sm sm:text-base px-4">{t.relatedSub}</p>
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
                    aria-label={lang === 'de' ? 'Zu Voice Agents navigieren' : 'Navigate to Voice Agents'}
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
                    aria-label={lang === 'de' ? 'Zum Dashboard navigieren' : 'Navigate to Dashboard'}
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
