import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/Button';
import { apiRequest, ApiRequestError } from '../services/api';
import { CheckCircle2, AlertCircle, Paperclip, X } from 'lucide-react';

interface WebdesignContactFormProps {
  onSuccess?: () => void;
}

interface SelectedFile {
  file: File;
  id: string;
}

export const WebdesignContactForm: React.FC<WebdesignContactFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    requestType: 'new' as 'new' | 'redesign',
    message: '',
  });
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles: SelectedFile[] = files.map(file => ({
      file,
      id: `${Date.now()}-${Math.random()}`,
    }));
    setSelectedFiles(prev => [...prev, ...newFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== id));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Bitte Namen angeben.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Bitte eine gültige E-Mail eingeben.');
      return;
    }
    if (!formData.requestType) {
      setError('Bitte wählen Sie eine Anfrageart.');
      return;
    }
    if (formData.message.trim().length < 12) {
      setError('Bitte beschreiben Sie Ihr Projekt (mind. 12 Zeichen).');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // Create FormData for multipart/form-data
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('company', formData.company);
      formDataToSend.append('requestType', formData.requestType);
      formDataToSend.append('message', formData.message);

      // Append files
      selectedFiles.forEach((selectedFile) => {
        formDataToSend.append('files', selectedFile.file);
      });

      await apiRequest('/webdesign/contact', {
        method: 'POST',
        data: formDataToSend,
        // Don't set Content-Type header - axios will set it automatically with boundary for FormData
      });

      setSuccess(true);
      setSelectedFiles([]);
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
          Wir haben Ihre Webdesign-Anfrage erhalten und melden uns innerhalb von 24 Stunden bei Ihnen.
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="webdesign-name" className="block text-sm text-gray-400 mb-2">
            Name *
          </label>
          <input
            id="webdesign-name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => { setError(null); setFormData({ ...formData, name: e.target.value }); }}
            autoComplete="name"
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-swiss-red focus:ring-2 focus:ring-swiss-red/20 outline-none transition-colors"
            placeholder="Max Mustermann"
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="webdesign-email" className="block text-sm text-gray-400 mb-2">
            E-Mail *
          </label>
          <input
            id="webdesign-email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => { setError(null); setFormData({ ...formData, email: e.target.value }); }}
            autoComplete="email"
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-swiss-red focus:ring-2 focus:ring-swiss-red/20 outline-none transition-colors"
            placeholder="max@muster.ch"
            disabled={loading}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="webdesign-phone" className="block text-sm text-gray-400 mb-2">
            Telefon
          </label>
          <input
            id="webdesign-phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => { setError(null); setFormData({ ...formData, phone: e.target.value }); }}
            autoComplete="tel"
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-swiss-red focus:ring-2 focus:ring-swiss-red/20 outline-none transition-colors"
            placeholder="+41 44 123 45 67"
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="webdesign-company" className="block text-sm text-gray-400 mb-2">
            Unternehmen
          </label>
          <input
            id="webdesign-company"
            type="text"
            value={formData.company}
            onChange={(e) => { setError(null); setFormData({ ...formData, company: e.target.value }); }}
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-swiss-red focus:ring-2 focus:ring-swiss-red/20 outline-none transition-colors"
            placeholder="Muster AG"
            disabled={loading}
          />
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend id="webdesign-request-type-label" className="block text-sm text-gray-400 mb-3">
          Art der Anfrage *
        </legend>
        <div id="webdesign-request-type" className="grid grid-cols-1 md:grid-cols-2 gap-4" role="radiogroup" aria-labelledby="webdesign-request-type-label">
          <label
            className={`p-4 rounded-lg border-2 transition-all text-left cursor-pointer ${
              formData.requestType === 'new'
                ? 'border-swiss-red bg-swiss-red/10 text-white'
                : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/20'
            }`}
          >
            <input
              type="radio"
              name="requestType"
              value="new"
              checked={formData.requestType === 'new'}
              onChange={() => { setError(null); setFormData({ ...formData, requestType: 'new' }); }}
              disabled={loading}
              className="sr-only"
            />
            <div className="font-semibold mb-1">Neue Website</div>
            <div className="text-sm text-gray-400">Komplette Website-Erstellung</div>
          </label>
          <label
            className={`p-4 rounded-lg border-2 transition-all text-left cursor-pointer ${
              formData.requestType === 'redesign'
                ? 'border-swiss-red bg-swiss-red/10 text-white'
                : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/20'
            }`}
          >
            <input
              type="radio"
              name="requestType"
              value="redesign"
              checked={formData.requestType === 'redesign'}
              onChange={() => { setError(null); setFormData({ ...formData, requestType: 'redesign' }); }}
              disabled={loading}
              className="sr-only"
            />
            <div className="font-semibold mb-1">Website Redesign</div>
            <div className="text-sm text-gray-400">Modernisierung bestehender Website</div>
          </label>
        </div>
      </fieldset>

      <div>
        <label htmlFor="webdesign-message" className="block text-sm text-gray-400 mb-2">
          Projektbeschreibung *
        </label>
        <textarea
          id="webdesign-message"
          required
          rows={5}
          value={formData.message}
          onChange={(e) => { setError(null); setFormData({ ...formData, message: e.target.value }); }}
          className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-swiss-red focus:ring-2 focus:ring-swiss-red/20 outline-none resize-none transition-colors"
          placeholder="Beschreiben Sie Ihr Projekt, Ihre Anforderungen und Wünsche..."
          disabled={loading}
        />
        <p className="text-xs text-gray-500 mt-1">Mindestens 12 Zeichen erforderlich</p>
      </div>

      {/* File Upload Section */}
      <div>
        <label htmlFor="webdesign-files" className="block text-sm text-gray-400 mb-2">
          Dateien anhängen (optional)
        </label>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              id="webdesign-files"
              type="file"
              multiple
              onChange={handleFileSelect}
              disabled={loading}
              className="hidden"
              accept=".zip,.rar,.7z,.jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Paperclip size={16} />
              Dateien auswählen
            </Button>
            <span className="text-xs text-gray-500">
              ZIP, Bilder, PDF, Dokumente (max. 10MB pro Datei)
            </span>
          </div>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              {selectedFiles.map((selectedFile) => (
                <motion.div
                  key={selectedFile.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Paperclip size={16} className="text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{selectedFile.file.name}</div>
                      <div className="text-xs text-gray-400">{formatFileSize(selectedFile.file.size)}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(selectedFile.id)}
                    disabled={loading}
                    className="ml-3 p-1 hover:bg-white/10 rounded transition-colors"
                    aria-label="Datei entfernen"
                  >
                    <X size={16} className="text-gray-400" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
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
          className="flex-1 bg-swiss-red hover:bg-red-700 text-white border-none"
        >
          {loading ? (
            <>
              <div className="mr-2 h-4 w-4 relative overflow-hidden rounded-sm">
                <motion.div
                  className="absolute inset-0 bg-white opacity-30"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    repeatType: 'reverse'
                  }}
                />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-50"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                />
              </div>
              Wird gesendet...
            </>
          ) : (
            'Anfrage senden (500 CHF)'
          )}
        </Button>
      </div>
    </form>
  );
};


