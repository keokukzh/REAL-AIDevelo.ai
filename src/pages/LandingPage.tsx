import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { SEO } from '../components/SEO';
import { TrustSection } from '../components/TrustSection';
import { Features } from '../components/Features';
import { IndustryTabs } from '../components/IndustryTabs';
import { DemoAudioSection } from '../components/DemoAudioSection';
import { CaseStudies } from '../components/CaseStudies';
import { ROICalculator } from '../components/ROICalculator';
import { DemoSection } from '../components/DemoSection';
import { Pricing } from '../components/Pricing';
import { HowItWorks } from '../components/HowItWorks';
import { FAQ } from '../components/FAQ';
import { Footer } from '../components/Footer';
import { LeadCaptureForm } from '../components/LeadCaptureForm';

export const LandingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const state = location.state as { scrollTarget?: string } | null;
    if (!state?.scrollTarget) return;

    const headerOffset = 80;
    const scrollToTarget = () => {
      const target = document.querySelector(state.scrollTarget as string);
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
  const startOnboarding = (industry?: string) => {
    if (industry) {
      navigate(`/onboarding?industry=${industry}`);
    } else {
      navigate('/onboarding');
    }
  };

  const scrollToLeadCapture = () => {
    const target = document.getElementById('lead-capture');
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
      <Navbar onStartOnboarding={startOnboarding} />
      <main>
        {/* 1. Hero with proper CTA */}
        <Hero onStartOnboarding={startOnboarding} />
        
        {/* 2. Trust Indicators */}
        <TrustSection />

        {/* 2b. Audio Demos - HIGH IMPACT (Moved up) */}
        <DemoAudioSection />
        
        {/* 3. Features & Industries */}
        <Features />
        
        
        <IndustryTabs onStartOnboarding={startOnboarding} />
        
        {/* 4. Social Proof / Case Studies */}
        <CaseStudies />
        
        {/* 5. ROI Calculator to show value */}
        <ROICalculator />
        
        {/* 6. Demo Booking before Pricing */}
        <DemoSection onStartOnboarding={startOnboarding} />
        
        {/* Lead Capture Form for demo requests */}
        <section id="lead-capture" className="py-20 bg-gradient-to-b from-black via-slate-950 to-black relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
          <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start relative z-10">
            <div className="space-y-4">
              <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide">
                Demo & Beratung
              </p>
              <h2 className="text-3xl md:text-4xl font-bold font-display text-white">
                Sichern Sie sich einen Rückruf innerhalb von 24h.
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                Hinterlassen Sie Ihre Kontaktdaten – wir zeigen Ihnen, wie der Voice Agent in Ihrem Alltag Termine bucht,
                Anrufe qualifiziert und keine Anfrage liegen bleibt.
              </p>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>✓ Schweizerdeutsch & Hochdeutsch – empathisch und klar</li>
                <li>✓ Nahtlose Kalender-Integration (Google, Outlook, Calendly)</li>
                <li>✓ Sofort startklar mit Branchen-Templates</li>
              </ul>
            </div>
            <LeadCaptureForm />
          </div>
        </section>

        {/* 7. Pricing with Recommendation */}
        <Pricing onStartOnboarding={startOnboarding} onOpenLeadCapture={scrollToLeadCapture} />
        
        {/* 8. Process Explanation */}
        <HowItWorks />
        
        {/* 9. Objection Handling */}
        <FAQ />
      </main>
      <Footer />
    </>
  );
};
