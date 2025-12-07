import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
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

export const LandingPage = () => {
  const navigate = useNavigate();
  const startOnboarding = () => navigate('/onboarding');

  return (
    <>
      <Navbar onStartOnboarding={startOnboarding} />
      <main>
        {/* 1. Hero with proper CTA */}
        <Hero onStartOnboarding={startOnboarding} />
        
        {/* 2. Trust Indicators */}
        <TrustSection />
        
        {/* 3. Features & Industries */}
        <Features />
        
        {/* 3b. Audio Demos - Moved up for impact */}
        <DemoAudioSection />
        
        <IndustryTabs onStartOnboarding={startOnboarding} />
        
        {/* 4. Social Proof / Case Studies */}
        <CaseStudies />
        
        {/* 5. ROI Calculator to show value */}
        <ROICalculator />
        
        {/* 6. Demo Booking before Pricing */}
        <DemoSection onStartOnboarding={startOnboarding} />
        
        {/* 7. Pricing with Recommendation */}
        <Pricing onStartOnboarding={startOnboarding} />
        
        {/* 8. Process Explanation */}
        <HowItWorks />
        
        {/* 9. Objection Handling */}
        <FAQ />
      </main>
      <Footer />
    </>
  );
};
