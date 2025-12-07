import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { TrustSection } from './components/TrustSection';
import { Features } from './components/Features';
import { IndustryTabs } from './components/IndustryTabs';
import { CaseStudies } from './components/CaseStudies';
import { ROICalculator } from './components/ROICalculator';
import { DemoSection } from './components/DemoSection';
import { Pricing } from './components/Pricing';
import { HowItWorks } from './components/HowItWorks';
import { FAQ } from './components/FAQ';
import { Footer } from './components/Footer';
import { VoiceOnboarding } from './components/VoiceOnboarding';

// Wrapper to handle scroll top on route change or hash scroll
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const element = document.querySelector(hash);
      if (element) {
        const headerOffset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
};

const LandingPage = () => {
  const navigate = useNavigate();
  const startOnboarding = () => navigate('/onboarding');

  return (
    <>
      <Navbar onStartOnboarding={startOnboarding} />
      <main>
        <Hero onStartOnboarding={startOnboarding} />
        <TrustSection />
        <ROICalculator />
        <Features />
        <IndustryTabs onStartOnboarding={startOnboarding} />
        <DemoSection onStartOnboarding={startOnboarding} />
        <HowItWorks />
        <CaseStudies />
        <Pricing onStartOnboarding={startOnboarding} />
        <FAQ />
      </main>
      <Footer />
    </>
  );
};

const OnboardingPage = () => {
    const navigate = useNavigate();
    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black">
            <VoiceOnboarding onBack={() => navigate('/')} />
        </div>
    );
};

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="bg-background min-h-screen text-white selection:bg-accent selection:text-black">
        <AnimatePresence mode='wait'>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
            </Routes>
        </AnimatePresence>
      </div>
    </BrowserRouter>
  );
}

export default App;