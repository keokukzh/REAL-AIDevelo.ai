import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface FormData {
  name: string;
  email: string;
  company: string;
  interest: 'webdesign' | 'voice' | 'both' | '';
  message: string;
  honeypot: string; // Anti-spam
}

interface FormState {
  status: 'idle' | 'loading' | 'success' | 'error';
  message: string;
}

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const ContactForm: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const formRef = useRef<HTMLFormElement>(null);
  const [lastSubmit, setLastSubmit] = useState<number>(0);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    company: '',
    interest: '',
    message: '',
    honeypot: '',
  });

  const [formState, setFormState] = useState<FormState>({
    status: 'idle',
    message: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name ist erforderlich';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-Mail ist erforderlich';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ungültige E-Mail-Adresse';
    }

    if (!formData.interest) {
      newErrors.interest = 'Bitte wähle ein Interesse';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot check
    if (formData.honeypot) {
      // Bot detected, fake success
      setFormState({ status: 'success', message: 'Danke für deine Nachricht!' });
      return;
    }

    // Rate limiting (client-side)
    const now = Date.now();
    if (now - lastSubmit < 10000) {
      setFormState({
        status: 'error',
        message: 'Bitte warte einen Moment vor dem erneuten Absenden.',
      });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setFormState({ status: 'loading', message: '' });
    setLastSubmit(now);

    try {
      const response = await fetch(`${API_BASE}/v1/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          company: formData.company,
          interest: formData.interest,
          message: formData.message,
          source: 'ultra-landing',
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setFormState({
          status: 'success',
          message: 'Vielen Dank! Wir melden uns innerhalb von 24 Stunden.',
        });
        setFormData({ name: '', email: '', company: '', interest: '', message: '', honeypot: '' });
      } else {
        throw new Error(data.error || 'Ein Fehler ist aufgetreten');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setFormState({
        status: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Ein Fehler ist aufgetreten. Bitte versuche es später erneut.',
      });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const inputClasses = (hasError: boolean) => `
    w-full px-4 py-3 bg-obsidian border rounded-xl text-white placeholder-gray-500
    transition-all duration-200 ultra-focus
    ${hasError ? 'border-red-500' : 'border-ultra-border hover:border-white/20 focus:border-cyan'}
  `;

  if (formState.status === 'success') {
    return (
      <motion.div
        className="text-center py-12"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center"
          initial={!prefersReducedMotion ? { scale: 0 } : undefined}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
        >
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </motion.div>
        <h3 className="text-2xl font-display font-bold text-white mb-3">Nachricht gesendet!</h3>
        <p className="text-gray-400 mb-6">{formState.message}</p>
        <button
          onClick={() => setFormState({ status: 'idle', message: '' })}
          className="text-cyan hover:underline ultra-focus"
        >
          Weitere Nachricht senden
        </button>
      </motion.div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Honeypot - hidden from users */}
      <input
        type="text"
        name="honeypot"
        value={formData.honeypot}
        onChange={handleChange}
        tabIndex={-1}
        autoComplete="off"
        style={{ position: 'absolute', left: '-9999px' }}
        aria-hidden="true"
      />

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
          Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Max Mustermann"
          className={inputClasses(!!errors.name)}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && (
          <p id="name-error" className="text-red-400 text-sm mt-1">
            {errors.name}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
          E-Mail <span className="text-red-400">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="max@beispiel.de"
          className={inputClasses(!!errors.email)}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <p id="email-error" className="text-red-400 text-sm mt-1">
            {errors.email}
          </p>
        )}
      </div>

      {/* Company */}
      <div>
        <label htmlFor="company" className="block text-sm font-medium text-gray-300 mb-2">
          Unternehmen <span className="text-gray-500">(optional)</span>
        </label>
        <input
          type="text"
          id="company"
          name="company"
          value={formData.company}
          onChange={handleChange}
          placeholder="Firma GmbH"
          className={inputClasses(false)}
        />
      </div>

      {/* Interest */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Interesse <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'webdesign', label: 'Webdesign' },
            { value: 'voice', label: 'Voice Agent' },
            { value: 'both', label: 'Beides' },
          ].map((option) => (
            <label
              key={option.value}
              className={`
                flex items-center justify-center px-4 py-3 rounded-xl border cursor-pointer transition-all ultra-focus
                ${
                  formData.interest === option.value
                    ? 'bg-gradient-to-r from-violet/20 to-cyan/20 border-cyan text-white'
                    : 'bg-obsidian border-ultra-border text-gray-400 hover:border-white/20 hover:text-white'
                }
              `}
            >
              <input
                type="radio"
                name="interest"
                value={option.value}
                checked={formData.interest === option.value}
                onChange={handleChange}
                className="sr-only"
              />
              <span className="text-sm font-medium">{option.label}</span>
            </label>
          ))}
        </div>
        {errors.interest && <p className="text-red-400 text-sm mt-2">{errors.interest}</p>}
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
          Nachricht <span className="text-gray-500">(optional)</span>
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          placeholder="Erzähl uns von deinem Projekt..."
          rows={4}
          className={`${inputClasses(false)} resize-none`}
        />
      </div>

      {/* Error message */}
      {formState.status === 'error' && (
        <motion.div
          className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{formState.message}</p>
        </motion.div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={formState.status === 'loading'}
        className={`
          group w-full py-4 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ultra-btn-sheen ultra-focus
          bg-gradient-to-r from-violet to-cyan text-obsidian hover:shadow-glow-ultra
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {formState.status === 'loading' ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Wird gesendet...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Kostenlose Analyse anfragen
          </>
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Mit dem Absenden stimmst du unserer Datenschutzerklärung zu.
      </p>
    </form>
  );
};
