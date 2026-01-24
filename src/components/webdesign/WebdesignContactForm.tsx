import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle2, AlertCircle, Upload, X, Shield, Lock, Zap, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';

interface WebdesignContactFormProps {
  onSuccess?: () => void;
  lang?: 'de' | 'en';
}

const FORM_DICTIONARY = {
  de: {
    labels: {
      name: "Vollständiger Name",
      email: "E-Mail Adresse",
      company: "Unternehmen (Optional)",
      message: "Erzählen Sie uns von Ihrem Projekt..."
    },
    placeholders: {
      name: "Max Mustermann",
      email: "max@beispiel.ch",
      company: "Beispiel GmbH",
      message: "Was ist Ihr Ziel? Was soll Ihre neue Website erreichen?"
    },
    projectTypes: {
      business: "Business Website",
      ecommerce: "E-Commerce",
      startup: "Startup Genesis",
      enterprise: "Enterprise Solution"
    },
    budgets: {
       low: "5k - 10k CHF",
       med: "10k - 25k CHF",
       high: "25k - 50k CHF",
       ultra: "50k+ CHF"
    },
    submit: "Projektanfrage senden",
    submitting: "Initialisiere Anfrage...",
    success: "Anfrage erfolgreich gesendet!",
    successSub: "Wir werden Ihre Vision prüfen und uns innerhalb von 24 Stunden bei Ihnen melden.",
    back: "Zurück zum Dashboard",
    error: "Fehler beim Senden",
    errorSub: "Bitte versuchen Sie es erneut oder kontaktieren Sie uns direkt."
  },
  en: {
    labels: {
      name: "Full Name",
      email: "Email Address",
      company: "Company (Optional)",
      message: "Tell us about your project..."
    },
    placeholders: {
      name: "John Doe",
      email: "john@example.com",
      company: "Example Ltd",
      message: "What is your goal? What should your new website achieve?"
    },
    projectTypes: {
      business: "Business Website",
      ecommerce: "E-Commerce",
      startup: "Startup Genesis",
      enterprise: "Enterprise Solution"
    },
    budgets: {
       low: "5k - 10k CHF",
       med: "10k - 25k CHF",
       high: "25k - 50k CHF",
       ultra: "50k+ CHF"
    },
    submit: "Send Project Inquiry",
    submitting: "Initializing Inquiry...",
    success: "Inquiry Sent Successfully!",
    successSub: "We will review your vision and get back to you within 24 hours.",
    back: "Back to Dashboard",
    error: "Sending Error",
    errorSub: "Please try again or contact us directly."
  }
};

export const WebdesignContactForm: React.FC<WebdesignContactFormProps> = ({ onSuccess, lang = 'de' }) => {
  const t = FORM_DICTIONARY[lang];
  const [formState, setFormState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    projectType: 'business',
    budget: '5k-10k',
    message: '',
    files: [] as File[]
  });
  const [activeField, setActiveField] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

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
    if (!message.trim()) return lang === 'de' ? 'Nachricht ist erforderlich' : 'Message is required';
    if (message.trim().length < 10) {
      return lang === 'de' ? 'Nachricht muss mindestens 10 Zeichen lang sein' : 'Message must be at least 10 characters';
    }
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
    // Real-time validation for touched fields
    if (touched[field]) {
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
    
    const messageError = validateMessage(formData.message);
    if (messageError) newErrors.message = messageError;

    // Mark all fields as touched
    setTouched({
      name: true,
      email: true,
      message: true,
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
    
    // Simulate API call
    setTimeout(() => {
      setFormState('success');
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 3000);
    }, 2000);
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
        <label htmlFor={inputId} className="sr-only">{label}</label>
        {isRequired ? (
          <input 
            id={inputId}
            type={id_key === 'email' ? 'email' : 'text'}
            value={formData[value] as string}
            onChange={e => {
              handleChange(value as string, e.target.value);
            }}
            onBlur={() => handleBlur(value as string, formData[value] as string)}
            onFocus={onFocus}
            className={`w-full bg-slate-900/50 border rounded-lg px-4 py-3 text-sm text-white font-mono placeholder:text-gray-600 transition-all outline-none focus-visible:ring-2 focus-visible:ring-swiss-red focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
              error 
                ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                : activeField === id_key 
                  ? 'border-swiss-red/50 shadow-[0_0_15px_rgba(218,41,28,0.1)]' 
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
            onBlur={() => handleBlur(value as string, formData[value] as string)}
            onFocus={onFocus}
            className={`w-full bg-slate-900/50 border rounded-lg px-4 py-3 text-sm text-white font-mono placeholder:text-gray-600 transition-all outline-none focus-visible:ring-2 focus-visible:ring-swiss-red focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
              error 
                ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                : activeField === id_key 
                  ? 'border-swiss-red/50 shadow-[0_0_15px_rgba(218,41,28,0.1)]' 
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

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl focus-trap">
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

           <InputGroup 
              label={t.labels.company}
              id_key="company"
              value="company"
              placeholder={t.placeholders.company}
              onFocus={() => setActiveField('company')}
              isRequired={false}
           />

           <div className="space-y-3">
              <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest pl-1">Project Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                 {(Object.keys(t.projectTypes) as Array<keyof typeof t.projectTypes>).map((type) => (
                    <button
                       key={type}
                       type="button"
                       onClick={() => setFormData(prev => ({ ...prev, projectType: type }))}
                       className={`px-3 py-2 rounded-lg text-[10px] font-mono border transition-all ${formData.projectType === type ? 'bg-swiss-red/10 border-swiss-red/50 text-swiss-red' : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'}`}
                    >
                       {t.projectTypes[type]}
                    </button>
                 ))}
              </div>
           </div>

           <div className="space-y-3">
              <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest pl-1">Budget Allocation</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                 {(Object.keys(t.budgets) as Array<keyof typeof t.budgets>).map((b) => (
                    <button
                       key={b}
                       type="button"
                       onClick={() => setFormData(prev => ({ ...prev, budget: b }))}
                       className={`px-3 py-2 rounded-lg text-[10px] font-mono border transition-all focus-visible:ring-2 focus-visible:ring-swiss-red focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 min-h-[44px] ${formData.budget === b ? 'bg-swiss-red/10 border-swiss-red/50 text-swiss-red' : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'}`}
                       aria-pressed={formData.budget === b}
                    >
                       {t.budgets[b]}
                    </button>
                 ))}
              </div>
           </div>

           <div className="relative group">
              <label htmlFor="input-message" className="sr-only">{t.labels.message}</label>
              <textarea 
                 id="input-message"
                 rows={4}
                 value={formData.message}
                 onChange={e => handleChange('message', e.target.value)}
                 onBlur={() => handleBlur('message', formData.message)}
                 onFocus={() => setActiveField('message')}
                 className={`w-full bg-slate-900/50 border rounded-lg px-4 py-3 text-sm text-white font-mono placeholder:text-gray-600 transition-all outline-none resize-none focus-visible:ring-2 focus-visible:ring-swiss-red focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                   errors.message 
                     ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                     : activeField === 'message' 
                       ? 'border-swiss-red/50 shadow-[0_0_15px_rgba(218,41,28,0.1)]' 
                       : 'border-white/10 hover:border-white/20'
                 }`}
                 placeholder={t.placeholders.message}
                 aria-required="true"
                 aria-invalid={errors.message ? 'true' : 'false'}
                 aria-describedby={errors.message ? 'input-message-error' : undefined}
                 required
              />
              <div className="absolute right-3 top-3 text-[10px] text-gray-400 font-mono uppercase tracking-wider bg-slate-900/80 px-1" aria-hidden="true">
                 Project Mission
              </div>
              {errors.message && (
                <div id="input-message-error" role="alert" className="mt-2 text-sm text-red-400 font-mono">
                  {errors.message}
                </div>
              )}
           </div>

           <Button
             type="submit"
             disabled={formState === 'loading'}
             variant="primary"
             className="w-full h-14 relative overflow-hidden group/btn shadow-[0_0_30px_rgba(218,41,28,0.2)]"
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
                   <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" aria-hidden="true" />
                </div>
              )}
           </Button>
        </form>
      </div>
    </div>
  );
};
