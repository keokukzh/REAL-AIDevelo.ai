import React from 'react';
import { SEO } from '../components/SEO';
import { Navbar } from '../components/Navbar';
import { SplitPortal } from '../components/SplitPortal';
import { Footer } from '../components/Footer';

export const LandingPage: React.FC = () => {
  return (
    <div className="bg-black min-h-screen overflow-x-hidden">
      <SEO
        title="AIDevelo - Webdesign & KI-Telefonassistenten für Schweizer KMU"
        description="Premium Webdesign und KI-Telefonassistenten für Schweizer KMUs. Hochmoderne Websites und 24/7 Voice Agents für messbares Wachstum."
        keywords="Webdesign, Voice Agent, KI Telefon, Automation, React, Schweiz, KMU, Schweizerdeutsch"
        canonicalUrl="https://aidevelo.ai"
        ogImage="https://aidevelo.ai/og-image.jpg"
        ogType="website"
        twitterCard="summary_large_image"
      />

      <Navbar />
      
      <main>
        <SplitPortal />
      </main>

      <Footer />
    </div>
  );
};
