import React from 'react';
import { Navbar } from '../components/Navbar';
import { SEO } from '../components/SEO';
import { 
  VoiceAgentsComingSoon, 
  DashboardPreviewSlideshow, 
  VoiceAudioDemo 
} from '../components/voiceagent';
import { FAQ } from '../components/FAQ';
import { Footer } from '../components/Footer';

export const VoiceAgentPage: React.FC = () => {
  return (
    <div className="bg-black min-h-screen">
      <SEO 
        title="Voice Agents Coming Soon - AIDevelo"
        description="KI-Telefonassistenten für Schweizer Unternehmen. In Kürze verfügbar. Holen Sie sich jetzt exklusiven Vorabzugriff."
      />
      <Navbar />
      <main className="pt-20">
        <VoiceAgentsComingSoon />
        
        {/* Deep Dive into what is coming */}
        <div className="py-20 bg-slate-950/30">
          <div className="container mx-auto px-6 text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold font-display text-white mb-6">
              Ein Einblick in die Zukunft
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Unsere Voice Agents sind mehr als nur Chatbots. Sie sind intelligente, zweisprachige Assistenten, die Ihre Geschäftsprozesse automatisieren.
            </p>
          </div>
          <DashboardPreviewSlideshow />
        </div>

        <VoiceAudioDemo />
        
        <div className="py-20 border-t border-white/5">
          <FAQ />
        </div>
      </main>
      <Footer />
    </div>
  );
};

