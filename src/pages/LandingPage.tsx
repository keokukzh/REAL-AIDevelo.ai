import React from 'react';
import { SEO } from '../components/SEO';
import { Navbar } from '../components/Navbar';
import { SplitPortal } from '../components/SplitPortal';

export const LandingPage: React.FC = () => {
  return (
    <div className="bg-black min-h-screen">
      <SEO 
        title="AIDevelo - Webdesign & KI-Telefonassistenten für Schweizer KMU"
        description="Ihre Schweizer Agentur für modernstes Webdesign und intelligente Voice Agents. Wir transformieren Ihre digitale Präsenz und automatisieren Ihre Telefonie."
      />
      <Navbar />
      <main className="relative">
        <SplitPortal />
      </main>
    </div>
  );
};
