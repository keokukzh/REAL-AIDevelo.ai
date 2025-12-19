import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/Button';
import { demoService, DemoRequest } from '../services/demoService';
import { Loader2, CheckCircle2, AlertCircle, Calendar, Shield, ArrowRight, ArrowLeft } from 'lucide-react';
import { trackFormStart, trackFormSubmit, trackCTAClick } from '../lib/analytics';

interface LeadCaptureFormProps {
  className?: string;
}

export const LeadCaptureForm: React.FC<LeadCaptureFormProps> = ({ className = '' }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState<DemoRequest>({
    name: '',
    company: '',
    email: '',
    phone: '',
    useCase: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formStarted, setFormStarted] = useState(false);

  // Track form start when user begins typing
  useEffect(() => {
    if (!formStarted && (formData.name || formData.email)) {
      setFormStarted(true);
      trackFormStart('lead_capture');
    }
  }, [formData.name, formData.email, formStarted]);

  const handleChange = (field: keyof DemoRequest) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setError(null);
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const validateStep1 = () => {
    if (!formData.name.trim()) return 'Bitte geben Sie Ihren Namen an.';
    if (!formData.email.trim() || !formData.email.includes('@')) {
      return 'Bitte geben Sie eine gültige E-Mail-Adresse ein (z.B. max@muster.ch).';
    }
    return null;
  };

  const validateStep2 = () => {
    if (formData.phone && formData.phone.trim().length < 7) {
      return 'Bitte geben Sie eine gültige Telefonnummer an oder lassen Sie das Feld leer.';
    }
    if (!formData.useCase || formData.useCase.trim().length < 10) {
      return 'Bitte beschreiben Sie kurz Ihren Use Case (mindestens 10 Zeichen).';
    }
    return null;
  };

  const handleNext = () => {
    const validationError = validateStep1();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await demoService.submitDemoRequest(formData);
      trackFormSubmit('lead_capture', true);
      setSuccess(true);
    } catch (err) {
      trackFormSubmit('lead_capture', false);
      setError('Senden fehlgeschlagen. Bitte versuchen Sie es erneut oder buchen Sie direkt einen Termin.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 backdrop-blur ${className}`}
      >
        <div className="flex items-center gap-3 text-emerald-300">
          <CheckCircle2 className="w-6 h-6" />
          <div>
            <p className="font-semibold">Vielen Dank! Wir melden uns innerhalb von 24 Stunden bei Ihnen.</p>
            <p className="text-sm text-emerald-100/80">Sie erhalten in Kürze eine Bestätigung per E-Mail.</p>
          </div>
        </div>
        <a
          href="https://calendly.com/aidevelo-enterprise"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackCTAClick('calendly_success', 'lead_capture_success')}
          className="mt-4 inline-flex items-center gap-2 text-sm text-emerald-100 underline decoration-emerald-300/70 hover:text-white"
        >
          <Calendar size={16} />
          Direkt einen Termin im Kalender buchen
        </a>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-xl space-y-4 ${className}`}
    >
      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            step >= 1 ? 'bg-accent text-black' : 'bg-gray-700 text-gray-400'
          }`}>
            1
          </div>
          <span className={`text-sm ${step >= 1 ? 'text-white' : 'text-gray-500'}`}>Kontakt</span>
        </div>
        <div className="flex-1 h-[1px] bg-gray-700 mx-4" />
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            step >= 2 ? 'bg-accent text-black' : 'bg-gray-700 text-gray-400'
          }`}>
            2
          </div>
          <span className={`text-sm ${step >= 2 ? 'text-white' : 'text-gray-500'}`}>Details</span>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
          <Shield size={12} />
          <span>DSGVO-konform</span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
          <Shield size={12} />
          <span>nDSG-konform</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div className="space-y-1">
              <label htmlFor="lead-name" className="text-sm text-gray-300">Ihr Name *</label>
              <input
                id="lead-name"
                required
                value={formData.name}
                onChange={handleChange('name')}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-3 text-white focus:border-accent outline-none"
                placeholder="Max Muster"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="lead-email" className="text-sm text-gray-300">E-Mail-Adresse *</label>
              <input
                id="lead-email"
                required
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                autoComplete="email"
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-3 text-white focus:border-accent outline-none"
                placeholder="ihre@email.ch"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-red-300 text-sm">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="button"
              onClick={handleNext}
              variant="primary"
              className="w-full justify-center"
            >
              Weiter
              <ArrowRight size={16} />
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="lead-company" className="text-sm text-gray-300">Firma</label>
                <input
                  id="lead-company"
                  value={formData.company}
                  onChange={handleChange('company')}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-3 text-white focus:border-accent outline-none"
                  placeholder="Muster AG"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="lead-phone" className="text-sm text-gray-300">Telefon</label>
                <input
                  id="lead-phone"
                  value={formData.phone}
                  onChange={handleChange('phone')}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-3 text-white focus:border-accent outline-none"
                  placeholder="+41 44 123 45 67"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="lead-usecase" className="text-sm text-gray-300">Kurz Ihr Use Case *</label>
              <textarea
                id="lead-usecase"
                value={formData.useCase}
                onChange={handleChange('useCase')}
                rows={3}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-3 text-white focus:border-accent outline-none resize-none"
                placeholder="Z.B. Terminbuchung für Praxis, Öffnungszeiten, gewünschte Sprachen..."
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-red-300 text-sm">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={handleBack}
                variant="outline"
                className="flex-1 justify-center"
              >
                <ArrowLeft size={16} />
                Zurück
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="flex-1 justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Schritt 2/2: Wird gesendet...</span>
                  </>
                ) : (
                  'Demo anfragen'
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-4 border-t border-white/10">
        <a
          href="https://calendly.com/aidevelo-enterprise"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackCTAClick('calendly_form', 'lead_capture')}
          className="flex items-center justify-center gap-2 rounded-full border border-accent/50 px-4 py-3 text-accent hover:bg-accent/10 transition-colors text-sm w-full"
        >
          <Calendar size={16} />
          Direkt Termin buchen
        </a>
      </div>
    </form>
  );
};

