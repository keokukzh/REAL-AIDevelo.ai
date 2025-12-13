import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/Button';
import { demoService, DemoRequest } from '../services/demoService';
import { Loader2, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';

interface LeadCaptureFormProps {
  className?: string;
}

export const LeadCaptureForm: React.FC<LeadCaptureFormProps> = ({ className = '' }) => {
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

  const handleChange = (field: keyof DemoRequest) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setError(null);
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const validate = () => {
    if (!formData.name.trim()) return 'Bitte geben Sie Ihren Namen an.';
    if (!formData.email.trim() || !formData.email.includes('@')) return 'Bitte eine gültige E-Mail eingeben.';
    if (formData.phone && formData.phone.trim().length < 7) return 'Bitte eine gültige Telefonnummer angeben oder leer lassen.';
    if (formData.useCase && formData.useCase.trim().length < 10) return 'Kurz Ihren Use Case schildern (mind. 10 Zeichen).';
    return null;
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
      setSuccess(true);
    } catch (err) {
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
            <p className="font-semibold">Danke! Wir melden uns kurzfristig.</p>
            <p className="text-sm text-emerald-100/80">Sie erhalten in Kürze eine Bestätigung per E-Mail.</p>
          </div>
        </div>
        <a
          href="https://calendly.com/aidevelo-enterprise"
          target="_blank"
          rel="noopener noreferrer"
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
      <div className="space-y-1">
        <label className="text-sm text-gray-300">Name *</label>
        <input
          required
          value={formData.name}
          onChange={handleChange('name')}
          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-3 text-white focus:border-accent outline-none"
          placeholder="Max Muster"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-gray-300">E-Mail *</label>
        <input
          required
          type="email"
          value={formData.email}
          onChange={handleChange('email')}
          autoComplete="email"
          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-3 text-white focus:border-accent outline-none"
          placeholder="max@muster.ch"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm text-gray-300">Firma</label>
          <input
            value={formData.company}
            onChange={handleChange('company')}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-3 text-white focus:border-accent outline-none"
            placeholder="Muster AG"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-gray-300">Telefon</label>
          <input
            value={formData.phone}
            onChange={handleChange('phone')}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-3 text-white focus:border-accent outline-none"
            placeholder="+41 44 123 45 67"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm text-gray-300">Kurz Ihr Use Case *</label>
        <textarea
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

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className="flex-1 justify-center"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              <span>Wird gesendet...</span>
            </>
          ) : (
            'Demo anfragen'
          )}
        </Button>
        <a
          href="https://calendly.com/aidevelo-enterprise"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-full border border-accent/50 px-4 py-3 text-accent hover:bg-accent/10 transition-colors text-sm"
        >
          <Calendar size={16} />
          Direkt Termin buchen
        </a>
      </div>
    </form>
  );
};

