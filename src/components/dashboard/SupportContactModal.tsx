import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../newDashboard/ui/Button';
import { apiRequest, ApiRequestError } from '../../services/api';
import { toast } from '../ui/Toast';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface SupportContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportContactModal: React.FC<SupportContactModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      setError('Bitte Namen angeben.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Bitte eine gültige E-Mail eingeben.');
      return;
    }
    if (!formData.subject.trim()) {
      setError('Bitte Betreff angeben.');
      return;
    }
    if (formData.message.trim().length < 12) {
      setError('Nachricht muss mindestens 12 Zeichen lang sein.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiRequest('/support/contact', {
        method: 'POST',
        data: formData,
      });

      setSuccess(true);
      toast.success('Support-Anfrage erfolgreich gesendet');
      
      // Reset form and close after delay
      setTimeout(() => {
        setFormData({ name: '', email: '', subject: '', message: '' });
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof ApiRequestError
        ? err.message
        : 'Fehler beim Senden der Nachricht. Bitte versuchen Sie es später erneut.';
      setError(errorMessage);
      toast.error('Fehler beim Senden der Support-Anfrage');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({ name: '', email: '', subject: '', message: '' });
      setSuccess(false);
      setError(null);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Support kontaktieren"
      size="lg"
    >
      {success ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold mb-2 text-white">Vielen Dank!</h3>
          <p className="text-gray-400 mb-4">
            Ihre Support-Anfrage wurde erfolgreich übermittelt. Wir melden uns innerhalb von 24 Stunden bei Ihnen.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="support-name" className="block text-sm text-gray-400 mb-2">
                Name *
              </label>
              <input
                id="support-name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => { setError(null); setFormData({ ...formData, name: e.target.value }); }}
                autoComplete="name"
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-white focus:border-swiss-red focus:ring-2 focus:ring-swiss-red/20 outline-none transition-colors"
                placeholder="Max Mustermann"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="support-email" className="block text-sm text-gray-400 mb-2">
                E-Mail *
              </label>
              <input
                id="support-email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => { setError(null); setFormData({ ...formData, email: e.target.value }); }}
                autoComplete="email"
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-white focus:border-swiss-red focus:ring-2 focus:ring-swiss-red/20 outline-none transition-colors"
                placeholder="max@example.ch"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="support-subject" className="block text-sm text-gray-400 mb-2">
              Betreff *
            </label>
            <input
              id="support-subject"
              type="text"
              required
              value={formData.subject}
              onChange={(e) => { setError(null); setFormData({ ...formData, subject: e.target.value }); }}
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-white focus:border-swiss-red focus:ring-2 focus:ring-swiss-red/20 outline-none transition-colors"
              placeholder="Kurze Beschreibung Ihres Anliegens"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="support-message" className="block text-sm text-gray-400 mb-2">
              Nachricht *
            </label>
            <textarea
              id="support-message"
              required
              rows={5}
              value={formData.message}
              onChange={(e) => { setError(null); setFormData({ ...formData, message: e.target.value }); }}
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-white focus:border-swiss-red focus:ring-2 focus:ring-swiss-red/20 outline-none resize-none transition-colors"
              placeholder="Beschreiben Sie Ihr Anliegen im Detail..."
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">Mindestens 12 Zeichen erforderlich</p>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-swiss-red hover:bg-red-700 text-white border-none"
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
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
            >
              Abbrechen
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
