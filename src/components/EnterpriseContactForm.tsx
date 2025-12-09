import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/Button';
import { apiRequest, ApiRequestError } from '../services/api';
import { Loader2, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';

interface EnterpriseContactFormProps {
  onSuccess?: () => void;
}

export const EnterpriseContactForm: React.FC<EnterpriseContactFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Bitte Namen angeben.');
      return;
    }
    if (!formData.company.trim()) {
      setError('Bitte Firmennamen angeben.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Bitte eine gültige E-Mail eingeben.');
      return;
    }
    if (formData.message.trim().length < 12) {
      setError('Kurz Ihr Anliegen schildern (mind. 12 Zeichen).');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      await apiRequest('/enterprise/contact', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      setSuccess(true);
      if (onSuccess) {
        setTimeout(() => onSuccess(), 2000);
      }
    } catch (err) {
      const errorMessage = err instanceof ApiRequestError
        ? err.message
        : 'Fehler beim Senden der Nachricht. Bitte versuchen Sie es später erneut.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center p-8"
      >
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Vielen Dank!</h3>
        <p className="text-gray-400 mb-4">
          Wir haben Ihre Anfrage erhalten und melden uns innerhalb von 24 Stunden bei Ihnen.
        </p>
        <p className="text-sm text-gray-500">
          Sie können auch direkt einen Termin buchen:
        </p>
        <a
          href="https://calendly.com/aidevelo-enterprise"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-4 text-accent hover:text-accent/80 transition-colors"
        >
          <Calendar size={16} />
          Termin buchen
        </a>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => { setError(null); setFormData({ ...formData, name: e.target.value }); }}
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-accent outline-none"
            placeholder="Max Mustermann"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Firma *
          </label>
          <input
            type="text"
            required
            value={formData.company}
            onChange={(e) => { setError(null); setFormData({ ...formData, company: e.target.value }); }}
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-accent outline-none"
            placeholder="Muster AG"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            E-Mail *
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => { setError(null); setFormData({ ...formData, email: e.target.value }); }}
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-accent outline-none"
            placeholder="max@muster.ch"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Telefon
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => { setError(null); setFormData({ ...formData, phone: e.target.value }); }}
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-accent outline-none"
            placeholder="+41 44 123 45 67"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">
          Nachricht *
        </label>
        <textarea
          required
          rows={5}
          value={formData.message}
          onChange={(e) => { setError(null); setFormData({ ...formData, message: e.target.value }); }}
          className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-accent outline-none resize-none"
          placeholder="Erzählen Sie uns von Ihren Anforderungen..."
        />
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 animate-spin" size={16} />
              Wird gesendet...
            </>
          ) : (
            'Anfrage senden'
          )}
        </Button>
        <a
          href="https://calendly.com/aidevelo-enterprise"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-6 py-3 border border-accent/50 text-accent rounded-lg hover:bg-accent/10 transition-colors"
        >
          <Calendar size={16} />
          Direkt Termin buchen
        </a>
      </div>
    </form>
  );
};

