import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Shield, Lock, Zap, ArrowRight, Mail, Phone, Calendar, FileText } from 'lucide-react';
import { Button } from '../ui/Button';
import { API_BASE_URL } from '../../services/apiBase';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface WebdesignContactFormProps {
  onSuccess?: () => void;
  lang?: 'de' | 'en';
}

const FORM_DICTIONARY = {
  de: {
    labels: {
      name: "Vollständiger Name",
      email: "E-Mail Adresse",
      phone: "Telefonnummer (Optional)",
      company: "Unternehmen (Optional)",
      currentWebsiteUrl: "Aktuelle Website URL (Optional)",
      message: "Erzählen Sie uns von Ihrem Projekt..."
    },
    placeholders: {
      name: "Max Mustermann",
      email: "max@beispiel.ch",
      phone: "+41 79 123 45 67",
      company: "Beispiel GmbH",
      currentWebsiteUrl: "https://www.beispiel.ch",
      message: "Welche Geschäftsziele verfolgen Sie? Wie soll Ihre Website zu Ihrem Wachstum beitragen?"
    },
    requestTypes: {
      new: "Neue Website",
      redesign: "Redesign"
    },
    submit: "Projektanfrage senden",
    submitting: "Initialisiere Anfrage...",
    success: "Anfrage erfolgreich gesendet!",
    successSub: "Vielen Dank für Ihr Vertrauen. Wir analysieren Ihre Anforderungen strategisch und melden uns innerhalb von 24 Stunden mit einem massgeschneiderten Konzept.",
    back: "Zurück zum Dashboard",
    error: "Fehler beim Senden",
    errorSub: "Bitte versuchen Sie es erneut. Bei anhaltenden Problemen kontaktieren Sie uns direkt – wir helfen Ihnen gerne persönlich weiter.",
    whatHappensNext: "Was passiert nach Ihrer Anfrage?",
    nextSteps: [
      { icon: Mail, text: "Sofortige Bestätigung per E-Mail – Ihre Anfrage ist bei uns angekommen" },
      { icon: Calendar, text: "Kostenlose Erstberatung – wir entwickeln gemeinsam Ihre digitale Strategie" },
      { icon: FileText, text: "Massgeschneidertes Konzept mit transparentem Festpreis innerhalb von 48 Stunden" },
      { icon: Phone, text: "Persönlicher Ansprechpartner – wir begleiten Sie von der Idee bis zum Erfolg" },
    ],
  },
  en: {
    labels: {
      name: "Full Name",
      email: "Email Address",
      phone: "Phone Number (Optional)",
      company: "Company (Optional)",
      currentWebsiteUrl: "Current Website URL (Optional)",
      message: "Describe your project and goals..."
    },
    placeholders: {
      name: "John Doe",
      email: "john@example.com",
      phone: "+1 555 123 4567",
      company: "Example Ltd",
      currentWebsiteUrl: "https://www.example.com",
      message: "What business goals are you pursuing? How should your website contribute to your growth?"
    },
    requestTypes: {
      new: "New Website",
      redesign: "Redesign"
    },
    submit: "Send Project Inquiry",
    submitting: "Initializing Inquiry...",
    success: "Inquiry Sent Successfully!",
    successSub: "Thank you for your trust. We will strategically analyze your requirements and get back to you within 24 hours with a tailor-made concept.",
    back: "Back to Dashboard",
    error: "Sending Error",
    errorSub: "Please try again. If problems persist, contact us directly – we are happy to help you personally.",
    whatHappensNext: "What happens after your inquiry?",
    nextSteps: [
      { icon: Mail, text: "Immediate confirmation email – your inquiry has been received" },
      { icon: Calendar, text: "Free initial consultation – we develop your digital strategy together" },
      { icon: FileText, text: "Tailor-made concept with transparent fixed pricing within 48 hours" },
      { icon: Phone, text: "Personal contact person – we accompany you from idea to success" },
    ],
  }
};

export const WebdesignContactForm: React.FC<WebdesignContactFormProps> = ({ onSuccess, lang = 'de' }) => {
  const t = FORM_DICTIONARY[lang];
  const prefersReducedMotion = useReducedMotion();
  const [formState, setFormState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [activeField, setActiveField] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Validation functions
  const validateEmail = (email: string): string | null => {
    if (!email) return lang === 'de' ? 'E-Mail ist erforderlich' : 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return lang === 'de' ? 'Ungültige E-Mail-Adresse' : 'Invalid email address';
    }
    return null;
  };

  const validateName = (name: string): string | null => {
    if (!name.trim()) return lang === 'de' ? 'Name ist erforderlich' : 'Name is required';
    if (name.trim().length < 2) {
      return lang === 'de' ? 'Name muss mindestens 2 Zeichen lang sein' : 'Name must be at least 2 characters';
    }
    return null;
  };

  const validateMessage = (message: string): string | null => {
    if (!message.trim()) return null; // Message is now optional
    return null;
  };

  const validateField = (field: string, value: string): string | null => {
    switch (field) {
      case 'name':
        return validateName(value);
      case 'email':
        return validateEmail(value);
      case 'message':
        return validateMessage(value);
      default:
        return null;
    }
  };

  const handleBlur = (field: string, value: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, value);
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Real-time validation - validate immediately on change for better UX
    const error = validateField(field, value);
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all required fields
    const newErrors: Record<string, string> = {};
    const nameError = validateName(formData.name);
    if (nameError) newErrors.name = nameError;
    
    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    // Mark all fields as touched
    setTouched({
      name: true,
      email: true,
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Focus first error field
      const firstErrorField = Object.keys(newErrors)[0];
      const firstErrorInput = document.getElementById(`input-${firstErrorField}`);
      if (firstErrorInput) {
        firstErrorInput.focus();
      }
      return;
    }

    setFormState('loading');

    try {
      // Prepare FormData for multipart/form-data request
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      if (formData.message) {
        formDataToSend.append('message', formData.message);
      }

      // Make API call
      const response = await fetch(`${API_BASE_URL}/webdesign/contact`, {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to submit request');
      }

      const result = await response.json();
      
      if (result.success) {
        setFormState('success');
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 3000);
      } else {
        throw new Error(result.message || 'Failed to submit request');
      }
    } catch (error) {
      console.error('[WebdesignContactForm] Error submitting form:', error);
      setFormState('error');
      setErrors({
        submit: error instanceof Error ? error.message : (lang === 'de' ? 'Fehler beim Senden der Anfrage' : 'Error sending request'),
      });
    }
  };

  const InputGroup: React.FC<{
    label: string;
    id_key: keyof typeof t.labels;
    value: keyof typeof formData;
    placeholder: string;
    onFocus: () => void;
    isRequired?: boolean;
    error?: string;
  }> = ({ label, id_key, value, placeholder, onFocus, isRequired = false, error }) => {
    const inputId = `input-${id_key}`;
    const errorId = `${inputId}-error`;
    const describedBy = error ? errorId : undefined;
    
    return (
      <div className="relative group">
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-300 mb-2">
          {label}
          {isRequired && <span className="text-swiss-red ml-1" aria-label="required">*</span>}
        </label>
        {isRequired ? (
          <input 
            id={inputId}
            type={id_key === 'email' ? 'email' : 'text'}
            value={formData[value] as string}
            onChange={e => {
              handleChange(value as string, e.target.value);
            }}
            onBlur={() => {
              handleBlur(value as string, formData[value] as string);
              setFocusedField(null);
            }}
            onFocus={() => {
              onFocus();
              setFocusedField(id_key);
            }}
            className={`w-full bg-slate-900/50 border rounded-lg px-4 py-3 text-sm text-white font-mono placeholder:text-gray-600 transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-swiss-red focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
              error 
                ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                : focusedField === id_key 
                  ? 'border-swiss-red/50 shadow-[0_0_20px_rgba(218,41,28,0.2)] scale-[1.01]' 
                  : 'border-white/10 hover:border-white/20'
            }`}
            placeholder={placeholder}
            aria-required="true"
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={describedBy}
            required
          />
        ) : (
          <input 
            id={inputId}
            type={id_key === 'email' ? 'email' : 'text'}
            value={formData[value] as string}
            onChange={e => {
              handleChange(value as string, e.target.value);
            }}
            onBlur={() => {
              handleBlur(value as string, formData[value] as string);
              setFocusedField(null);
            }}
            onFocus={() => {
              onFocus();
              setFocusedField(id_key);
            }}
            className={`w-full bg-slate-900/50 border rounded-lg px-4 py-3 text-sm text-white font-mono placeholder:text-gray-600 transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-swiss-red focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 min-h-[44px] ${
              error 
                ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                : focusedField === id_key 
                  ? 'border-swiss-red/50 shadow-[0_0_20px_rgba(218,41,28,0.2)] scale-[1.01]' 
                  : 'border-white/10 hover:border-white/20'
            }`}
            placeholder={placeholder}
            aria-required="false"
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={describedBy}
          />
        )}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-mono uppercase tracking-wider bg-slate-900/80 px-1" aria-hidden="true">
          {label}
        </div>
        {error && (
          <div id={errorId} role="alert" className="mt-2 text-sm text-red-400 font-mono">
            {error}
          </div>
        )}
      </div>
    );
  };

  if (formState === 'success') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900/50 backdrop-blur-xl border border-emerald-500/20 rounded-3xl p-12 text-center"
        role="alert"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6" aria-hidden="true">
           <CheckCircle2 size={40} className="text-emerald-400" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">{t.success}</h3>
        <p className="text-gray-400 font-light mb-8 max-w-sm mx-auto">
           {t.successSub}
        </p>
        <Button onClick={() => window.location.href = '/'} variant="outline" aria-label={t.back}>
           {t.back}
        </Button>
      </motion.div>
    );
  }

  if (formState === 'error') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900/50 backdrop-blur-xl border border-red-500/20 rounded-3xl p-12 text-center"
        role="alert"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6" aria-hidden="true">
           <AlertCircle size={40} className="text-red-400" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">{t.error}</h3>
        <p className="text-gray-400 font-light mb-8 max-w-sm mx-auto">
           {errors.submit || t.errorSub}
        </p>
        <Button onClick={() => setFormState('idle')} variant="outline" aria-label={lang === 'de' ? 'Erneut versuchen' : 'Try again'}>
           {lang === 'de' ? 'Erneut versuchen' : 'Try again'}
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl focus-trap">
      {/* Alternative Contact Methods */}
      <div className="p-6 sm:p-8 border-b border-white/10 bg-white/5">
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
          whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 text-center">
            {lang === 'de' ? 'Oder kontaktieren Sie uns direkt:' : 'Or contact us directly:'}
          </h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.a
              href="tel:+41791234567"
              whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
              whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
              className="flex items-center justify-center gap-3 px-6 py-3 bg-slate-900/40 border border-white/10 rounded-lg hover:border-white/20 hover:bg-white/5 transition-all text-white"
              aria-label={lang === 'de' ? 'Direkt anrufen' : 'Call directly'}
            >
              <Phone className="w-5 h-5 text-swiss-red" />
              <span className="font-medium">{lang === 'de' ? 'Direkt anrufen' : 'Call'}</span>
            </motion.a>
            <motion.a
              href="mailto:webdesign@aidevelo.ai"
              whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
              whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
              className="flex items-center justify-center gap-3 px-6 py-3 bg-slate-900/40 border border-white/10 rounded-lg hover:border-white/20 hover:bg-white/5 transition-all text-white"
              aria-label={lang === 'de' ? 'E-Mail senden' : 'Send email'}
            >
              <Mail className="w-5 h-5 text-swiss-red" />
              <span className="font-medium">{lang === 'de' ? 'E-Mail senden' : 'Email'}</span>
            </motion.a>
          </div>
          <p className="text-sm text-gray-400 mt-4 text-center">
            {lang === 'de' 
              ? 'Wir melden uns innerhalb von 24 Stunden' 
              : 'We respond within 24 hours'}
          </p>
        </motion.div>
      </div>

      {/* "Was passiert danach?" Section */}
      <div className="p-8 lg:p-12 border-b border-white/10 bg-white/5">
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
          whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Zap className="w-6 h-6 text-swiss-red" />
            {t.whatHappensNext}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {t.nextSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -20 }}
                whileInView={prefersReducedMotion ? {} : { opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={prefersReducedMotion ? {} : { x: 4, scale: 1.02 }}
                className="flex items-center gap-3 p-4 rounded-xl bg-slate-900/40 border border-white/5 hover:border-white/20 transition-all group"
              >
                <div className="p-2 rounded-lg bg-swiss-red/10 border border-swiss-red/20 group-hover:bg-swiss-red/20 transition-colors">
                  <step.icon size={20} className="text-swiss-red" />
                </div>
                <span className="text-gray-300 group-hover:text-white transition-colors text-sm font-medium">
                  {step.text}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Sidebar Info */}
        <aside className="lg:col-span-4 p-8 lg:p-12 bg-white/5 border-b lg:border-b-0 lg:border-r border-white/10" aria-label="Form security information">
           <div className="space-y-8">
              <div>
                 <div className="text-[10px] font-mono text-swiss-red/80 uppercase tracking-widest mb-2">Protocol</div>
                 <h4 className="text-white font-bold text-xl">Digital Genesis</h4>
              </div>
              
              <div className="space-y-4" role="list">
                 {[
                   { icon: Shield, label: 'End-to-End Encryption' },
                   { icon: Lock, label: 'Secure Data Handling' },
                   { icon: Zap, label: 'Priority Processing' }
                 ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-gray-300" role="listitem">
                       <item.icon size={16} className="text-swiss-red/60" aria-hidden="true" />
                       <span>{item.label}</span>
                    </div>
                 ))}
              </div>
           </div>
        </aside>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="lg:col-span-8 p-8 lg:p-12 space-y-6" noValidate>
          {/* Live region for form errors */}
          <div 
            role="alert" 
            aria-live="polite" 
            aria-atomic="true" 
            className="sr-only"
          >
            {Object.keys(errors).length > 0 && (
              <span>
                {lang === 'de' 
                  ? `Formularfehler: ${Object.values(errors).join(', ')}` 
                  : `Form errors: ${Object.values(errors).join(', ')}`}
              </span>
            )}
          </div>
          
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputGroup 
                label={t.labels.name}
                id_key="name"
                value="name"
                placeholder={t.placeholders.name}
                onFocus={() => setActiveField('name')}
                isRequired={true}
                error={errors.name}
              />
              <InputGroup 
                label={t.labels.email}
                id_key="email"
                value="email"
                placeholder={t.placeholders.email}
                onFocus={() => setActiveField('email')}
                isRequired={true}
                error={errors.email}
              />
           </div>

           <div className="relative group">
              <label htmlFor="input-message" className="block text-sm font-medium text-gray-300 mb-2">
                {t.labels.message}
                <span className="text-gray-500 text-xs ml-2">({lang === 'de' ? 'Optional' : 'Optional'})</span>
              </label>
              <textarea 
                 id="input-message"
                 rows={4}
                 value={formData.message}
                 onChange={e => handleChange('message', e.target.value)}
                 onBlur={() => {
                   handleBlur('message', formData.message);
                   setFocusedField(null);
                 }}
                 onFocus={() => {
                   setActiveField('message');
                   setFocusedField('message');
                 }}
                 className={`w-full bg-slate-900/50 border rounded-lg px-4 py-3 text-sm text-white font-mono placeholder:text-gray-600 transition-all duration-300 outline-none resize-none focus-visible:ring-2 focus-visible:ring-swiss-red focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 min-h-[44px] ${
                   errors.message 
                     ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                     : focusedField === 'message' 
                       ? 'border-swiss-red/50 shadow-[0_0_20px_rgba(218,41,28,0.2)] scale-[1.01]' 
                       : 'border-white/10 hover:border-white/20'
                 }`}
                 placeholder={t.placeholders.message}
                 aria-required="false"
                 aria-invalid={errors.message ? 'true' : 'false'}
                 aria-describedby={errors.message ? 'input-message-error' : undefined}
              />
              <div className="absolute right-3 top-3 text-[10px] text-gray-400 font-mono uppercase tracking-wider bg-slate-900/80 px-1" aria-hidden="true">
                 {lang === 'de' ? 'Kurze Nachricht (optional)' : 'Brief message (optional)'}
              </div>
              {errors.message && (
                <div id="input-message-error" role="alert" className="mt-2 text-sm text-red-400 font-mono">
                  {errors.message}
                </div>
              )}
           </div>

           <motion.div
             whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
             whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
             transition={{ duration: 0.3, ease: 'easeOut' }}
           >
             <Button
               type="submit"
               disabled={formState === 'loading'}
               variant="primary"
               className="w-full h-14 relative overflow-hidden group/btn shadow-[0_0_30px_rgba(218,41,28,0.2)] transition-all duration-300"
               aria-label={formState === 'loading' ? t.submitting : t.submit}
             >
                {formState === 'loading' ? (
                  <div className="flex items-center gap-3">
                     <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     {t.submitting}
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                     {t.submit}
                     <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform duration-300" aria-hidden="true" />
                  </div>
                )}
             </Button>
           </motion.div>
        </form>
      </div>
    </div>
  );
};
