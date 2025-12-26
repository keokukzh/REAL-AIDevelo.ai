import React, { Suspense, lazy } from 'react';
import { SEO } from '../components/SEO';
import { LoadingSpinner } from '../components/LoadingSpinner';

// Core components (loaded immediately)
import {
  AuroraBackground,
  NoiseOverlay,
  StickyNav,
  SplitHero,
  AnimatedMarquee,
} from '../components/ultra-landing';

// Lazy-loaded sections for performance
const ServicesSection = lazy(() =>
  import('../components/ultra-landing/ServicesSection').then((m) => ({
    default: m.ServicesSection,
  })),
);
const ShowcaseGrid = lazy(() =>
  import('../components/ultra-landing/ShowcaseGrid').then((m) => ({ default: m.ShowcaseGrid })),
);
const ProcessTimeline = lazy(() =>
  import('../components/ultra-landing/ProcessTimeline').then((m) => ({
    default: m.ProcessTimeline,
  })),
);
const StackGrid = lazy(() =>
  import('../components/ultra-landing/StackGrid').then((m) => ({ default: m.StackGrid })),
);
const PricingCards = lazy(() =>
  import('../components/ultra-landing/PricingCards').then((m) => ({ default: m.PricingCards })),
);
const FAQSection = lazy(() =>
  import('../components/ultra-landing/FAQSection').then((m) => ({ default: m.FAQSection })),
);
const FinalCTA = lazy(() =>
  import('../components/ultra-landing/FinalCTA').then((m) => ({ default: m.FinalCTA })),
);
const ParticleField = lazy(() =>
  import('../components/ultra-landing/ParticleField').then((m) => ({ default: m.ParticleField })),
);

// Footer component
import { Footer } from '../components/Footer';

const SectionLoader: React.FC = () => (
  <div className="flex items-center justify-center py-20">
    <LoadingSpinner />
  </div>
);

export const LandingPage: React.FC = () => {
  return (
    <div className="bg-obsidian min-h-screen overflow-x-hidden">
      <SEO
        title="AIDevelo.ai – Webdesign & Voice Agents für messbares Wachstum"
        description="Premium Webdesign und KI-Voice-Agents für DACH-Unternehmen. Conversion-first Design, 24/7 Telefon-Automation. Kostenlose Analyse anfragen."
        keywords="Webdesign, Voice Agent, KI Telefon, Automation, React, Next.js, DACH, Schweiz, Deutschland, Österreich"
        canonicalUrl="https://aidevelo.ai"
        ogImage="https://aidevelo.ai/og-image.jpg"
        ogType="website"
        twitterCard="summary_large_image"
      />

      {/* Noise overlay (subtle grain texture) */}
      <NoiseOverlay />

      {/* Sticky navigation */}
      <StickyNav />

      {/* Main content */}
      <AuroraBackground>
        {/* Particle field (lazy, canvas) */}
        <Suspense fallback={null}>
          <ParticleField particleCount={40} />
        </Suspense>

        {/* Hero Section with Split Layout */}
        <SplitHero />

        {/* Trust Marquee */}
        <AnimatedMarquee />

        {/* Services Section */}
        <Suspense fallback={<SectionLoader />}>
          <ServicesSection />
        </Suspense>

        {/* Showcase / Work */}
        <Suspense fallback={<SectionLoader />}>
          <ShowcaseGrid />
        </Suspense>

        {/* Process Timeline */}
        <Suspense fallback={<SectionLoader />}>
          <ProcessTimeline />
        </Suspense>

        {/* Tech Stack */}
        <Suspense fallback={<SectionLoader />}>
          <StackGrid />
        </Suspense>

        {/* Pricing */}
        <Suspense fallback={<SectionLoader />}>
          <PricingCards />
        </Suspense>

        {/* FAQ */}
        <Suspense fallback={<SectionLoader />}>
          <FAQSection />
        </Suspense>

        {/* Final CTA + Contact Form */}
        <Suspense fallback={<SectionLoader />}>
          <FinalCTA />
        </Suspense>

        {/* Footer */}
        <Footer />
      </AuroraBackground>
    </div>
  );
};
