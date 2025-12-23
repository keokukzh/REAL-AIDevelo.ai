import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../config/navigation';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { SEO } from '../components/SEO';
import { Features } from '../components/Features';
import { IndustryTabs } from '../components/IndustryTabs';
import { DemoSection } from '../components/DemoSection';
import { DemoAudioSection } from '../components/DemoAudioSection';
import { DashboardPreviewSlideshow } from '../components/voiceagent/DashboardPreviewSlideshow';
import { ROICalculator } from '../components/ROICalculator';
import { HowItWorks } from '../components/HowItWorks';
import { Pricing } from '../components/Pricing';
import { FAQ } from '../components/FAQ';
import { Footer } from '../components/Footer';
import { useAuthContext } from '../contexts/AuthContext';
import { StickyRegistrationWidget } from '../components/voiceagent/StickyRegistrationWidget';

export const VoiceAgentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthContext();

  useEffect(() => {
    const state = location.state as { scrollTarget?: string } | null;
    if (!state?.scrollTarget) return;

    // Safe anchor validation: only allow safe anchor IDs (not Supabase tokens)
    const SAFE_ANCHOR_REGEX = /^#[A-Za-z][A-Za-z0-9_-]*$/;
    const scrollTarget = state.scrollTarget as string;
    
    // Ignore unsafe hashes (e.g., #access_token=..., #code=...)
    if (!SAFE_ANCHOR_REGEX.test(scrollTarget)) {
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }

    const headerOffset = 80;
    const scrollToTarget = () => {
      const target = document.querySelector(scrollTarget);
      if (target) {
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    };

    // allow DOM to paint before scrolling
    requestAnimationFrame(() => scrollToTarget());
    navigate(location.pathname, { replace: true, state: {} });
  }, [location, navigate]);

  const handleStartOnboarding = () => {
    navigate(ROUTES.ONBOARDING);
  };

  const handleScrollToSection = (href: string) => {
    const target = document.querySelector(href);
    if (target) {
      const headerOffset = 80;
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  return (
    <>
      <SEO />
      <Navbar />
      <main>
        {/* Hero Section */}
        <Hero 
          onStartOnboarding={handleStartOnboarding}
          onScrollToSection={handleScrollToSection}
        />
        
        {/* Dashboard Preview Slideshow */}
        <DashboardPreviewSlideshow />
        
        {/* Features */}
        <Features />
        
        {/* Industry Tabs */}
        <IndustryTabs />
        
        {/* Demo Section */}
        <DemoSection />
        
        {/* Demo Audio Section */}
        <DemoAudioSection />
        
        {/* ROI Calculator */}
        <ROICalculator />
        
        {/* How It Works */}
        <HowItWorks />
        
        {/* Pricing */}
        <Pricing />
        
        {/* FAQ */}
        <FAQ />
      </main>
      <Footer />
      <StickyRegistrationWidget />
    </>
  );
};

