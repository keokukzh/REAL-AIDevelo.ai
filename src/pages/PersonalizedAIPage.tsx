import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Navbar } from '../components/Navbar';
import {
  PersonalizedAIHero,
  AIServicesGrid,
  AIProcessFlow,
  AICaseStudies,
  AIConsultationForm,
  AITechStack,
  ScrollReveal,
  WebdesignAnimatedBackground,
} from '../components/personalized-ai';
import { ErrorBoundary } from '../components/ErrorBoundary';
import {
  MessageSquare,
  Zap,
  Workflow,
  Code,
  Database,
  BarChart3,
  Building2,
  Heart,
  DollarSign,
  Home,
  UtensilsCrossed,
  Brain,
  Cloud,
  Shield,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Footer } from '../components/Footer';
import { ROUTES } from '../config/navigation';

const DICTIONARY = {
  de: {
    heroText1: 'Personalisierte KI für',
    heroText2: 'Ihr Geschäft',
    heroSub:
      'Von der Strategie bis zur Implementierung – maßgeschneiderte KI-Lösungen für Schweizer KMU. Wir bringen Ihre Geschäftsprozesse auf die nächste Stufe.',
    missionStart: 'Kostenlose Erstberatung buchen',
    scrollExplore: 'Scrollen zum Entdecken',
    skipToContent: 'Zum Hauptinhalt springen',
    servicesTitle: 'Unsere KI-Services',
    servicesSub:
      'Von Voice Agents bis zu Custom Solutions – wir bieten umfassende KI-Implementierung für Ihr Unternehmen.',
    services: [
      {
        icon: MessageSquare,
        title: 'Voice Agents Integration',
        description:
          '24/7 KI-Telefonassistenten, die Ihre Kundenanrufe entgegennehmen, Termine buchen und Fragen beantworten. Perfekt für Schweizer KMU.',
        color: 'text-swiss-red',
        bgColor: 'bg-swiss-red/10',
      },
      {
        icon: Zap,
        title: 'Chatbot-Entwicklung',
        description:
          'Intelligente Chatbots für Website, WhatsApp und andere Kanäle. Multilingual, branchenspezifisch und nahtlos integriert.',
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
      },
      {
        icon: Workflow,
        title: 'Prozess-Automatisierung',
        description:
          'Automatisieren Sie repetitive Aufgaben mit KI. Von E-Mail-Verarbeitung bis zu Datenanalyse – effizienter arbeiten, mehr Zeit für das Wesentliche.',
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
      },
      {
        icon: Code,
        title: 'Custom KI-Lösungen',
        description:
          'Maßgeschneiderte KI-Anwendungen für Ihre spezifischen Anforderungen. Von der Konzeption bis zur Implementierung.',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
      },
      {
        icon: Database,
        title: 'CRM/ERP Integration',
        description:
          'Nahtlose Integration Ihrer KI-Lösungen in bestehende Systeme wie HubSpot, Salesforce oder Ihre eigenen Tools.',
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
      },
      {
        icon: BarChart3,
        title: 'Datenanalyse & Insights',
        description:
          'KI-gestützte Datenanalyse für bessere Geschäftsentscheidungen. Predictive Analytics und automatisierte Reporting.',
        color: 'text-swiss-red',
        bgColor: 'bg-swiss-red/10',
      },
    ],
    processTitle: 'Unser 5-Schritte-Prozess',
    processSub:
      'Von der ersten Beratung bis zur kontinuierlichen Optimierung – ein strukturierter Ansatz für nachhaltigen Erfolg.',
    processSteps: [
      {
        number: '01',
        title: 'Beratung & Analyse',
        description:
          'Wir analysieren Ihre Geschäftsprozesse, identifizieren Optimierungspotenziale und entwickeln eine individuelle KI-Strategie.',
      },
      {
        number: '02',
        title: 'Konzept & Strategie',
        description:
          'Basierend auf der Analyse erstellen wir ein detailliertes Konzept mit konkreten Lösungsvorschlägen und einem klaren Implementierungsplan.',
      },
      {
        number: '03',
        title: 'Entwicklung & Implementierung',
        description:
          'Unsere Experten entwickeln und implementieren Ihre maßgeschneiderte KI-Lösung. Regelmäßige Updates halten Sie über den Fortschritt informiert.',
      },
      {
        number: '04',
        title: 'Integration & Training',
        description:
          'Nahtlose Einbindung in Ihre bestehenden Systeme und Prozesse. Wir schulen Ihr Team und stellen sicher, dass alles reibungslos läuft.',
      },
      {
        number: '05',
        title: 'Support & Optimierung',
        description:
          'Kontinuierliche Überwachung, Optimierung und Support. Wir passen die Lösung an sich ändernde Anforderungen an und maximieren den ROI.',
      },
    ],
    caseStudiesTitle: 'Erfolgsgeschichten',
    caseStudiesSub:
      'Wie Schweizer Unternehmen mit unseren KI-Lösungen ihre Effizienz steigern und ihre Kundenbetreuung verbessern.',
    caseStudies: [
      {
        icon: Building2,
        industry: 'Einzelhandel',
        title: 'E-Commerce Chatbot',
        description:
          'Ein Schweizer Online-Shop implementierte einen intelligenten Chatbot, der 80% der Kundenanfragen automatisch beantwortet.',
        results: [
          '80% weniger Support-Anfragen',
          '24/7 Kundenbetreuung',
          '30% höhere Conversion-Rate',
        ],
      },
      {
        icon: Heart,
        industry: 'Gesundheitswesen',
        title: 'Terminbuchungs-Automatisierung',
        description:
          'Eine Zahnarztpraxis nutzt unseren Voice Agent für automatische Terminbuchungen und Erinnerungen.',
        results: [
          'Keine verpassten Anrufe mehr',
          '50% weniger Doppelbuchungen',
          'Mehr Zeit für Patienten',
        ],
      },
      {
        icon: DollarSign,
        industry: 'Finanzdienstleistungen',
        title: 'KI-gestützte Datenanalyse',
        description:
          'Ein Finanzdienstleister nutzt unsere KI-Lösung für automatisierte Risikoanalyse und Kundenbewertung.',
        results: [
          'Schnellere Entscheidungen',
          'Reduzierte Fehlerquote',
          'Bessere Compliance',
        ],
      },
      {
        icon: Home,
        industry: 'Immobilien',
        title: 'Lead-Qualifizierung',
        description:
          'Ein Immobilienmakler automatisiert die Erstqualifizierung von Interessenten mit unserem Voice Agent.',
        results: [
          'Höhere Lead-Qualität',
          'Weniger Zeitverschwendung',
          'Mehr erfolgreiche Abschlüsse',
        ],
      },
      {
        icon: UtensilsCrossed,
        industry: 'Gastronomie',
        title: 'Reservierungs-System',
        description:
          'Ein Restaurant nutzt unseren Voice Agent für Reservierungen und Bestellungen außerhalb der Öffnungszeiten.',
        results: [
          'Mehr Reservierungen',
          'Bessere Auslastung',
          'Zufriedenere Gäste',
        ],
      },
    ],
    techStackTitle: 'Unser Technologie-Stack',
    techStackSub:
      'Wir nutzen modernste KI-Technologien und bewährte Tools für zuverlässige, skalierbare Lösungen.',
    technologies: [
      {
        name: 'OpenAI GPT-4',
        description: 'Fortschrittliche Sprachmodelle für natürliche Konversationen',
        icon: Brain,
        category: 'KI-Modelle',
      },
      {
        name: 'Anthropic Claude',
        description: 'Sicherheitsorientierte KI für sensible Anwendungen',
        icon: Brain,
        category: 'KI-Modelle',
      },
      {
        name: 'ElevenLabs',
        description: 'Natürlich klingende Sprachsynthese für Voice Agents',
        icon: MessageSquare,
        category: 'Voice-Technologie',
      },
      {
        name: 'OpenAI Realtime API',
        description: 'Echtzeit-Spracherkennung und -verarbeitung',
        icon: MessageSquare,
        category: 'Voice-Technologie',
      },
      {
        name: 'Qdrant',
        description: 'Vector-Datenbank für RAG und semantische Suche',
        icon: Database,
        category: 'Datenbanken',
      },
      {
        name: 'PostgreSQL',
        description: 'Robuste relationale Datenbank für Geschäftsdaten',
        icon: Database,
        category: 'Datenbanken',
      },
      {
        name: 'React & TypeScript',
        description: 'Moderne Frontend-Entwicklung für Dashboards und Interfaces',
        icon: Code,
        category: 'Entwicklung',
      },
      {
        name: 'Node.js',
        description: 'Skalierbare Backend-Infrastruktur',
        icon: Code,
        category: 'Entwicklung',
      },
      {
        name: 'Cloudflare',
        description: 'Globales CDN und Edge-Computing für Performance',
        icon: Cloud,
        category: 'Infrastruktur',
      },
      {
        name: 'Swiss Hosting',
        description: 'DSGVO-konformes Hosting auf Schweizer Servern',
        icon: Shield,
        category: 'Infrastruktur',
      },
    ],
    contactTitle: 'Kostenlose Erstberatung',
    contactSub: 'Lassen Sie uns gemeinsam die perfekte KI-Lösung für Ihr Unternehmen entwickeln.',
    relatedTitle: 'Weitere Services',
  },
  en: {
    heroText1: 'Personalized AI for',
    heroText2: 'Your Business',
    heroSub:
      'From strategy to implementation – tailor-made AI solutions for Swiss SMEs. We take your business processes to the next level.',
    missionStart: 'Book Free Consultation',
    scrollExplore: 'Scroll to Explore',
    skipToContent: 'Skip to main content',
    servicesTitle: 'Our AI Services',
    servicesSub:
      'From Voice Agents to Custom Solutions – we offer comprehensive AI implementation for your business.',
    services: [
      {
        icon: MessageSquare,
        title: 'Voice Agents Integration',
        description:
          '24/7 AI phone assistants that handle customer calls, book appointments, and answer questions. Perfect for Swiss SMEs.',
        color: 'text-swiss-red',
        bgColor: 'bg-swiss-red/10',
      },
      {
        icon: Zap,
        title: 'Chatbot Development',
        description:
          'Intelligent chatbots for website, WhatsApp, and other channels. Multilingual, industry-specific, and seamlessly integrated.',
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
      },
      {
        icon: Workflow,
        title: 'Process Automation',
        description:
          'Automate repetitive tasks with AI. From email processing to data analysis – work more efficiently, more time for what matters.',
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
      },
      {
        icon: Code,
        title: 'Custom AI Solutions',
        description:
          'Tailor-made AI applications for your specific requirements. From conception to implementation.',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
      },
      {
        icon: Database,
        title: 'CRM/ERP Integration',
        description:
          'Seamless integration of your AI solutions into existing systems like HubSpot, Salesforce, or your own tools.',
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
      },
      {
        icon: BarChart3,
        title: 'Data Analytics & Insights',
        description:
          'AI-powered data analysis for better business decisions. Predictive analytics and automated reporting.',
        color: 'text-swiss-red',
        bgColor: 'bg-swiss-red/10',
      },
    ],
    processTitle: 'Our 5-Step Process',
    processSub:
      'From initial consultation to continuous optimization – a structured approach for sustainable success.',
    processSteps: [
      {
        number: '01',
        title: 'Consultation & Analysis',
        description:
          'We analyze your business processes, identify optimization potential, and develop an individual AI strategy.',
      },
      {
        number: '02',
        title: 'Concept & Strategy',
        description:
          'Based on the analysis, we create a detailed concept with concrete solution proposals and a clear implementation plan.',
      },
      {
        number: '03',
        title: 'Development & Implementation',
        description:
          'Our experts develop and implement your tailor-made AI solution. Regular updates keep you informed about progress.',
      },
      {
        number: '04',
        title: 'Integration & Training',
        description:
          'Seamless integration into your existing systems and processes. We train your team and ensure everything runs smoothly.',
      },
      {
        number: '05',
        title: 'Support & Optimization',
        description:
          'Continuous monitoring, optimization, and support. We adapt the solution to changing requirements and maximize ROI.',
      },
    ],
    caseStudiesTitle: 'Success Stories',
    caseStudiesSub:
      'How Swiss companies increase their efficiency and improve customer service with our AI solutions.',
    caseStudies: [
      {
        icon: Building2,
        industry: 'Retail',
        title: 'E-Commerce Chatbot',
        description:
          'A Swiss online shop implemented an intelligent chatbot that automatically answers 80% of customer inquiries.',
        results: [
          '80% fewer support requests',
          '24/7 customer service',
          '30% higher conversion rate',
        ],
      },
      {
        icon: Heart,
        industry: 'Healthcare',
        title: 'Appointment Booking Automation',
        description:
          'A dental practice uses our Voice Agent for automatic appointment booking and reminders.',
        results: [
          'No more missed calls',
          '50% fewer double bookings',
          'More time for patients',
        ],
      },
      {
        icon: DollarSign,
        industry: 'Financial Services',
        title: 'AI-Powered Data Analysis',
        description:
          'A financial services provider uses our AI solution for automated risk analysis and customer assessment.',
        results: [
          'Faster decisions',
          'Reduced error rate',
          'Better compliance',
        ],
      },
      {
        icon: Home,
        industry: 'Real Estate',
        title: 'Lead Qualification',
        description:
          'A real estate agent automates initial qualification of prospects with our Voice Agent.',
        results: [
          'Higher lead quality',
          'Less time wasted',
          'More successful closings',
        ],
      },
      {
        icon: UtensilsCrossed,
        industry: 'Hospitality',
        title: 'Reservation System',
        description:
          'A restaurant uses our Voice Agent for reservations and orders outside opening hours.',
        results: [
          'More reservations',
          'Better utilization',
          'Happier guests',
        ],
      },
    ],
    techStackTitle: 'Our Technology Stack',
    techStackSub:
      'We use cutting-edge AI technologies and proven tools for reliable, scalable solutions.',
    technologies: [
      {
        name: 'OpenAI GPT-4',
        description: 'Advanced language models for natural conversations',
        icon: Brain,
        category: 'AI Models',
      },
      {
        name: 'Anthropic Claude',
        description: 'Security-oriented AI for sensitive applications',
        icon: Brain,
        category: 'AI Models',
      },
      {
        name: 'ElevenLabs',
        description: 'Naturally sounding speech synthesis for Voice Agents',
        icon: MessageSquare,
        category: 'Voice Technology',
      },
      {
        name: 'OpenAI Realtime API',
        description: 'Real-time speech recognition and processing',
        icon: MessageSquare,
        category: 'Voice Technology',
      },
      {
        name: 'Qdrant',
        description: 'Vector database for RAG and semantic search',
        icon: Database,
        category: 'Databases',
      },
      {
        name: 'PostgreSQL',
        description: 'Robust relational database for business data',
        icon: Database,
        category: 'Databases',
      },
      {
        name: 'React & TypeScript',
        description: 'Modern frontend development for dashboards and interfaces',
        icon: Code,
        category: 'Development',
      },
      {
        name: 'Node.js',
        description: 'Scalable backend infrastructure',
        icon: Code,
        category: 'Development',
      },
      {
        name: 'Cloudflare',
        description: 'Global CDN and edge computing for performance',
        icon: Cloud,
        category: 'Infrastructure',
      },
      {
        name: 'Swiss Hosting',
        description: 'GDPR-compliant hosting on Swiss servers',
        icon: Shield,
        category: 'Infrastructure',
      },
    ],
    contactTitle: 'Free Initial Consultation',
    contactSub: 'Let us develop the perfect AI solution for your business together.',
    relatedTitle: 'Other Services',
  },
};

export const PersonalizedAIPage = () => {
  const navigate = useNavigate();
  const [lang, setLang] = useState<'de' | 'en'>('de');
  const t = DICTIONARY[lang];

  useEffect(() => {
    const params = new URLSearchParams(globalThis.window.location.search);
    if (params.get('lang') === 'en') setLang('en');
  }, []);

  const handleLangChange = useCallback((newLang: 'de' | 'en') => {
    setLang(newLang);
  }, []);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-swiss-red/30 overflow-x-hidden selection:text-white">
      <Helmet>
        <title>Personalisierte KI-Implementierung für Schweizer KMU | AIDevelo</title>
        <meta
          name="description"
          content="Maßgeschneiderte KI-Lösungen: Voice Agents, Chatbots, Automatisierung. Kostenlose Erstberatung für Ihr Unternehmen."
        />
        <meta property="og:title" content="Personalisierte KI-Implementierung | AIDevelo" />
        <meta
          property="og:description"
          content="Von der Strategie bis zur Implementierung – maßgeschneiderte KI-Lösungen für Schweizer KMU."
        />
        <meta property="og:type" content="website" />
        <link rel="alternate" hrefLang="de-CH" href="https://aidevelo.ai/personalized-ai" />
        <link rel="alternate" hrefLang="en" href="https://aidevelo.ai/personalized-ai?lang=en" />
      </Helmet>

      {/* Language & Theme Switcher */}
      <div className="fixed top-24 right-4 md:right-8 z-[100] flex items-center gap-3">
        <ThemeToggle />
        <div className="flex gap-2">
          <button
            onClick={() => handleLangChange('de')}
            className={`px-3 py-1 rounded-full text-xs font-mono border transition-all ${
              lang === 'de'
                ? 'bg-swiss-red border-swiss-red text-white shadow-[0_0_15px_rgba(218,41,28,0.4)]'
                : 'bg-slate-900/50 border-white/10 text-gray-400 hover:border-white/30'
            }`}
            aria-label="Switch to German"
          >
            DE
          </button>
          <button
            onClick={() => handleLangChange('en')}
            className={`px-3 py-1 rounded-full text-xs font-mono border transition-all ${
              lang === 'en'
                ? 'bg-swiss-red border-swiss-red text-white shadow-[0_0_15px_rgba(218,41,28,0.4)]'
                : 'bg-slate-900/50 border-white/10 text-gray-400 hover:border-white/30'
            }`}
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
          <ErrorBoundary fallback={<PersonalizedAIHero t={t} />}>
            <PersonalizedAIHero t={t} />
          </ErrorBoundary>
        </section>

        {/* Services Grid Section */}
        <AIServicesGrid
          t={{
            servicesTitle: t.servicesTitle,
            servicesSub: t.servicesSub,
            services: t.services,
          }}
        />

        {/* Process Flow Section */}
        <AIProcessFlow
          t={{
            processTitle: t.processTitle,
            processSub: t.processSub,
            steps: t.processSteps,
          }}
        />

        {/* Case Studies Section */}
        <AICaseStudies
          t={{
            caseStudiesTitle: t.caseStudiesTitle,
            caseStudiesSub: t.caseStudiesSub,
            caseStudies: t.caseStudies,
          }}
        />

        {/* Tech Stack Section */}
        <AITechStack
          t={{
            techStackTitle: t.techStackTitle,
            techStackSub: t.techStackSub,
            technologies: t.technologies,
          }}
        />

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
                <AIConsultationForm onSuccess={() => navigate('/')} lang={lang} />
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
                  onClick={() => navigate(ROUTES.WEBDESIGN)}
                  variant="outline"
                  className="min-h-[56px] px-8 text-white border-white/10 hover:border-white/20 hover:bg-white/5 backdrop-blur-sm transition-all"
                  aria-label="Zur Webdesign Seite navigieren"
                >
                  <span className="flex items-center gap-2">
                    <Code size={18} className="text-blue-500" />
                    Webdesign
                  </span>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
