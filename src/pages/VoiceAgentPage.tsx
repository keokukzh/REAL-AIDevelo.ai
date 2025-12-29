import React from 'react';
import { Navbar } from '../components/Navbar';
import { SEO } from '../components/SEO';
import { 
  VoiceHero,
  DashboardPreviewSlideshow, 
  VoiceAudioDemo,
  VoiceIndustryTabs,
  VoiceDemo,
  VoiceROICalculator,
  VoiceHowItWorks,
  VoicePricing,
} from '../components/voiceagent';
import { FAQ } from '../components/FAQ';
import { Footer } from '../components/Footer';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Calendar, 
  Brain, 
  Shield, 
  Globe, 
  BarChart3, 
  MessageSquare,
  CheckCircle2 
} from 'lucide-react';
import { RevealSection } from '../components/layout/RevealSection';

const comingSoonFeatures = [
  {
    icon: Clock,
    title: '24/7 Erreichbarkeit',
    description: 'Nie wieder einen Kunden verpassen. Ihr Agent nimmt jeden Anruf an – auch nachts und am Wochenende.',
  },
  {
    icon: Calendar,
    title: 'Termin-Automatik',
    description: 'Der Agent bucht Termine direkt in Ihren Google oder Outlook Kalender. Keine Doppelbuchungen.',
  },
  {
    icon: Globe,
    title: 'Schweizer Mundart',
    description: 'Versteht und spricht Schweizerdeutsch. Perfekt für lokale KMU und vertrauten Kundenkontakt.',
  },
  {
    icon: Brain,
    title: 'Sofortige Antwort',
    description: 'Keine Warteschleifen. Ihre Kunden erhalten sofortige Hilfe und Antworten auf ihre Fragen.',
  },
  {
    icon: Shield,
    title: 'Datenschutz (nDSG)',
    description: 'Hosting und Datenverarbeitung konform mit dem neuen Schweizer Datenschutzgesetz.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Sehen Sie alle Anrufe, Transkripte und Terminbuchungen übersichtlich aufbereitet.',
  },
  {
    icon: MessageSquare,
    title: 'Multichannel Pack',
    description: 'Ein Agent. Alle Kanäle. Webchat + WhatsApp nutzen dieselbe KI und Wissensbasis wie der Voice-Agent.',
  },
];

export const VoiceAgentPage: React.FC = () => {
  return (
    <div className="bg-black min-h-screen">
      <SEO 
        title="AI Telefonassistent für Schweizer KMU | 24/7 Terminbuchung | aidevelo.ai"
        description="Automatische Terminbuchung, Lead-Qualifizierung und Kundenbetreuung in Schweizerdeutsch. Geht in 24h live – ohne IT-Aufwand."
        keywords="Voice Agent, KI Telefon, Schweizerdeutsch, Terminbuchung, 24/7, KMU, Schweiz"
      />
      <Navbar />
      <main className="pt-20">
        {/* Hero Section */}
        <VoiceHero />

        {/* Dashboard Preview Section */}
        <section id="dashboard-preview" className="py-24 bg-gradient-to-b from-slate-950 via-black to-slate-950 relative overflow-hidden">
          <div className="container mx-auto px-6 relative z-10">
            <RevealSection className="text-center mb-12 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold font-display mb-6">
                Dashboard Preview
              </h2>
              <p className="text-gray-400 text-lg">
                Entdecken Sie die leistungsstarken Features unseres Dashboards. Registrieren Sie sich kostenlos für den Preview-Zugang.
              </p>
            </RevealSection>
            <DashboardPreviewSlideshow />
            <div className="text-center mt-12">
              <a
                href="/login"
                className="inline-flex items-center gap-2 px-8 py-4 bg-swiss-red text-white rounded-full font-semibold hover:bg-swiss-red/90 transition-colors"
              >
                Jetzt kostenlos registrieren
                <CheckCircle2 size={20} />
              </a>
              <p className="text-gray-400 text-sm mt-4">
                Erhalten Sie sofortigen Zugang zum Dashboard Preview
              </p>
            </div>
          </div>
        </section>

        {/* Coming Soon Features Section */}
        <section id="features" className="py-24 relative section-spacing">
          <div className="container mx-auto px-6 relative z-10">
            <RevealSection className="text-center mb-16 max-w-2xl mx-auto">
              <div className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-sm font-bold uppercase tracking-widest mb-4">
                Coming Soon: Voice Agents
              </div>
              <h2 className="text-3xl md:text-5xl font-bold font-display mb-6">
                In Kürze: Ihr KI-basierter Voice Agent.
              </h2>
              <p className="text-gray-400 text-lg">
                Wir arbeiten bereits an der nächsten Generation der Kundenkommunikation. Melden Sie sich an, um die Test-Agents bereits jetzt im Dashboard zu erleben.
              </p>
            </RevealSection>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {comingSoonFeatures.map((feature, index) => (
                <RevealSection key={feature.title} direction="up" delay={index * 0.1}>
                  <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all group">
                    <div className="w-16 h-16 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition-colors">
                      <feature.icon className="w-8 h-8 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                  </div>
                </RevealSection>
              ))}
            </div>

            <div className="text-center mt-12">
              <a
                href="/login"
                className="inline-flex items-center gap-2 px-8 py-4 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition-colors"
              >
                Jetzt für Preview registrieren
              </a>
            </div>
          </div>
        </section>

        {/* Industries Section */}
        <VoiceIndustryTabs />

        {/* Demo Section */}
        <section id="demo" className="py-24 bg-gradient-to-b from-background to-surface relative overflow-hidden section-spacing">
          <div className="container mx-auto px-6 relative z-10">
            <RevealSection className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold font-display mb-6">
                Terminbuchung in <span className="text-swiss-red">30 Sekunden</span>
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Sehen Sie, wie Ihr Voice Agent einen Anruf entgegennimmt, den Kunden qualifiziert und direkt einen Termin in Ihren Kalender bucht – alles in unter 30 Sekunden.
              </p>
            </RevealSection>
            <VoiceDemo />
          </div>
        </section>

        {/* Audio Demo Section */}
        <section className="py-24 bg-surface border-y border-white/5 relative overflow-hidden section-spacing">
          <div className="container mx-auto px-6 relative z-10">
            <RevealSection className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold font-display mb-6">
                Hören Sie den Unterschied
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Unsere Voice Agents klingen so menschlich, dass Ihre Kunden den Unterschied nicht bemerken werden. Überzeugen Sie sich selbst.
              </p>
            </RevealSection>
            <VoiceAudioDemo />
          </div>
        </section>

        {/* ROI Calculator Section */}
        <VoiceROICalculator />

        {/* How It Works Section */}
        <VoiceHowItWorks />

        {/* Pricing Section */}
        <VoicePricing />

        {/* FAQ Section */}
        <section id="faq" className="py-24 bg-surface/30 section-spacing">
          <div className="container mx-auto px-6">
            <FAQ />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};
