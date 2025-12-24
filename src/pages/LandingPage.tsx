import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../config/navigation';
import { Navbar } from '../components/Navbar';
import { WebdesignHero } from '../components/WebdesignHero';
import { WebdesignProcessFlow } from '../components/webdesign/WebdesignProcessFlow';
import { WebsitePreviews } from '../components/webdesign/WebsitePreviews';
import { SEO } from '../components/SEO';
import { TrustSection } from '../components/TrustSection';
import { Features } from '../components/Features';
import { FAQ } from '../components/FAQ';
import { Footer } from '../components/Footer';
import { RevealSection } from '../components/layout/RevealSection';
import { useAuthContext } from '../contexts/AuthContext';

export const LandingPage = () => {
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

  return (
    <>
      <SEO />
      <Navbar />
      <main>
        {/* 1. Webdesign Hero - Primary Focus */}
        <WebdesignHero />
        
        {/* 2. Process Flow - Visual 4 Steps */}
        <WebdesignProcessFlow />
        
        {/* 2.5 Portfolio / Website Previews */}
        <WebsitePreviews />
        
        {/* 3. Trust Indicators */}
        <TrustSection />
        
        {/* 4. Features */}
        <Features />
        
        {/* 5. Lead Capture for Webdesign */}
        <RevealSection id="lead-capture" className="py-20 bg-gradient-to-b from-black via-slate-950 to-black relative overflow-hidden section-spacing">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
          <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start relative z-10">
            <div className="space-y-4">
              <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-swiss-red/10 text-swiss-red text-xs font-semibold tracking-wide">
                Webdesign Anfrage
              </p>
              <h2 className="text-3xl md:text-4xl font-bold font-display text-white">
                Starten Sie Ihr Webdesign-Projekt noch heute.
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                Füllen Sie das Formular aus und erhalten Sie innerhalb von 24 Stunden eine Antwort. 
                Wir sammeln alle Informationen für Ihr Projekt und starten nach der Anzahlung direkt mit der Umsetzung.
              </p>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>✓ Professionelle Umsetzung in 2-3 Wochen</li>
                <li>✓ Responsive Design für alle Geräte</li>
                <li>✓ SEO-Optimiert und schnell</li>
              </ul>
            </div>
            <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
              <p className="text-white font-semibold mb-4">Jetzt anfragen</p>
              <p className="text-gray-400 text-sm mb-6">
                Besuchen Sie unsere Webdesign-Seite für das vollständige Anfrageformular.
              </p>
              <a
                href={ROUTES.WEBDESIGN}
                className="inline-flex items-center gap-2 bg-swiss-red hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Zum Webdesign-Formular
              </a>
            </div>
          </div>
        </RevealSection>
        
        {/* 6. FAQ */}
        <FAQ />
      </main>
      <Footer />
    </>
  );
};
