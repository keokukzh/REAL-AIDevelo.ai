import React from 'react';
import { Check } from 'lucide-react';
import { Button } from '../components/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/Card';
import { SEO } from '../components/SEO';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuthContext } from '../contexts/AuthContext';

interface PricingTier {
  name: string;
  price: string;
  description: string;
  features: string[];
  priceId: string;
  highlighted?: boolean;
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Starter',
    price: '29',
    description: 'Perfekt für kleine Unternehmen',
    priceId: 'price_1Soohn6bysxOOlngR8VsADtY',
    features: [
      '1 Voice Agent',
      '1.000 Voice Minuten pro Monat',
      'Basis Kalender-Integration',
      'Email Support',
      'Standard Stimmen',
    ],
  },
  {
    name: 'Professional',
    price: '99',
    description: 'Ideal für wachsende Unternehmen',
    priceId: 'price_1SoolM6bysxOOlngDM1WsEIb',
    highlighted: true,
    features: [
      '5 Voice Agents',
      '5.000 Voice Minuten pro Monat',
      'Erweiterte Kalender-Integration',
      'Priority Email & Chat Support',
      'Premium Stimmen (ElevenLabs)',
      'Custom Greetings & Personas',
      'Detailliertes Analytics Dashboard',
    ],
  },
  {
    name: 'Enterprise',
    price: '299',
    description: 'Für große Organisationen',
    priceId: 'price_1SoomX6bysxOOlngfeWSpVUT',
    features: [
      'Unbegrenzte Voice Agents',
      'Unbegrenzte Voice Minuten*',
      '24/7 Priority Support',
      'Dedicated Account Manager',
      'Custom Voice Training (Stimm-Kloning)',
      'Advanced API Zugang',
      'White-Label Option',
      'Custom SLA & Branding',
    ],
  },
];

export const PricingPage: React.FC = () => {
  const { session, isAuthenticated } = useAuthContext();

  const handleCheckout = async (priceId: string) => {
    if (!isAuthenticated) {
      window.location.href = `/login?redirect=/pricing`;
      return;
    }

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ priceId }),
      });

      if (!response.ok) {
        throw new Error('Checkout session creation failed');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

  return (
    <div className="bg-black min-h-screen text-white">
      <SEO
        title="Preise - AIDevelo KI Voice Agents"
        description="Finde den passenden Plan für deine KI-Telefonassistenten. Transparente Preise für Schweizer KMU."
        canonicalUrl="https://aidevelo.ai/pricing"
      />

      <Navbar />

      <main className="pt-32 pb-24 px-4 overflow-hidden relative">
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-accent/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-500">
              Wähle deinen perfekten Plan
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              24/7 Intelligente Voice Agents, die deine Kunden begeistern und Termine für dich
              buchen.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingTiers.map((tier) => (
              <Card
                key={tier.name}
                className={`flex flex-col relative h-full group ${
                  tier.highlighted
                    ? 'border-primary shadow-[0_0_50px_rgba(26,115,232,0.15)] bg-white/10'
                    : 'hover:border-white/20'
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                    <span className="bg-gradient-to-r from-primary to-accent text-white px-6 py-1.5 rounded-full text-sm font-bold shadow-lg">
                      BELIEBTESTE WAHL
                    </span>
                  </div>
                )}

                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-3xl font-bold mb-2">{tier.name}</CardTitle>
                  <CardDescription className="text-gray-400 min-h-[40px]">
                    {tier.description}
                  </CardDescription>
                  <div className="mt-8 flex items-baseline justify-center">
                    <span className="text-5xl font-extrabold tracking-tight">CHF {tier.price}</span>
                    <span className="text-gray-500 ml-2 text-lg">/Monat</span>
                  </div>
                </CardHeader>

                <CardContent className="flex-grow">
                  <ul className="space-y-4">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center mr-3 flex-shrink-0">
                          <Check className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-gray-300 text-sm leading-6">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-8">
                  <Button
                    onClick={() => handleCheckout(tier.priceId)}
                    variant={tier.highlighted ? 'primary' : 'outline'}
                    className="w-full text-lg py-6"
                  >
                    Jetzt starten
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="text-center mt-20 p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm max-w-3xl mx-auto">
            <h3 className="text-xl font-semibold mb-4 text-white">
              Hast du spezielle Anforderungen?
            </h3>
            <p className="text-gray-400 mb-6 italic">
              "Wir bieten auch individuelle Lösungen für Call Center und große Organisationen."
            </p>
            <Button
              variant="outline"
              className="px-12"
              onClick={() => (window.location.href = '/enterprise')}
            >
              Kontakt aufnehmen
            </Button>
            <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4 text-xs text-gray-500 font-medium tracking-wider">
              <span>UNTERSTÜTZT SCHWEIZERDEUTSCH</span>
              <span>100% DSGVO KONFORM</span>
              <span className="col-span-2 md:col-span-1">24/7 SUPPORT</span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
