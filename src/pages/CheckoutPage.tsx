import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { apiRequest, ApiRequestError } from '../services/api';
import { pricingPlans } from '../data/pricing';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('planId') || 'business';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerEmail, setCustomerEmail] = useState('');

  const plan = pricingPlans.find(p => p.id === planId);

  useEffect(() => {
    if (!plan) {
      navigate('/');
    }
    // Restore persisted identity info so we can provision defaults later
    const savedEmail = localStorage.getItem('aidevelo-user-email');
    if (savedEmail) {
      setCustomerEmail(savedEmail);
    }

    const existingUserId = localStorage.getItem('aidevelo-user-id');
    if (!existingUserId) {
      const newUserId = `guest-${crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)}`;
      localStorage.setItem('aidevelo-user-id', newUserId);
    }
  }, [plan, navigate]);

  const handleCheckout = async () => {
    if (!plan) return;

    // Enterprise plan - redirect to email
    if (planId === 'enterprise') {
      window.location.href = "mailto:enterprise@aidevelo.ai";
      return;
    }

    // FREE TEST MODE: Skip payment and go directly to onboarding
    setLoading(true);
    
    // Generate a mock purchase ID for testing
    const mockPurchaseId = `test_${Date.now()}_${planId}`;
    
    // Pass plan information to onboarding
    const planParams = new URLSearchParams({
      purchaseId: mockPurchaseId,
      planId: planId,
      planName: plan.name,
      planPrice: plan.price,
    });
    
    // Small delay for UX
    setTimeout(() => {
      navigate(`/onboarding?${planParams.toString()}`);
    }, 500);
  };

  if (!plan) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-white flex flex-col">
      <header className="p-6 border-b border-white/10 flex items-center justify-between">
        <div onClick={() => navigate('/')} className="cursor-pointer flex items-center gap-2">
          <img src="/main-logo.png" alt="AIDevelo.ai" className="h-8 w-auto object-contain" />
        </div>
        <Button variant="outline" onClick={() => navigate('/')} className="text-sm">
          <ArrowLeft size={16} className="mr-2" />
          Zurück
        </Button>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface/50 rounded-2xl border border-white/10 p-8"
        >
          <h1 className="text-3xl font-bold mb-2">Kostenlos testen</h1>
          <p className="text-gray-400 mb-8">Starten Sie jetzt mit dem kostenlosen Test und dem Onboarding.</p>
          
          <div className="mb-6 p-4 bg-accent/10 border border-accent/30 rounded-lg">
            <p className="text-sm text-accent font-medium">
              🎉 Testmodus aktiv: Alle Funktionen sind kostenlos verfügbar!
            </p>
          </div>

          {/* Plan Summary */}
          <div className="bg-white/5 rounded-xl p-6 mb-6 border border-white/10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-gray-400 text-sm">{plan.description}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {plan.price === 'Auf Anfrage' ? plan.price : `CHF ${plan.price}`}
                </div>
                {plan.price !== 'Auf Anfrage' && (
                  <div className="text-sm text-gray-400">/ Monat</div>
                )}
              </div>
            </div>

            <ul className="space-y-2 text-sm text-gray-300">
              {plan.features.slice(0, 3).map((feature, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-accent mt-1">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Email Input (Optional) */}
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">
              E-Mail-Adresse (optional, für Rechnung)
            </label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => {
                const value = e.target.value;
                setCustomerEmail(value);
                localStorage.setItem('aidevelo-user-email', value);
              }}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-accent outline-none"
              placeholder="ihre@email.ch"
            />
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <Button
            variant="primary"
            onClick={handleCheckout}
            disabled={loading}
            className="w-full py-4 text-lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 animate-spin" size={20} />
                Weiterleitung...
              </>
            ) : (
              'Kostenlos starten'
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center mt-4">
            Sie werden jetzt zum Onboarding weitergeleitet. Alle Funktionen sind im Testmodus kostenlos verfügbar.
          </p>
        </motion.div>
      </main>
    </div>
  );
};

