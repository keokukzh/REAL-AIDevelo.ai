import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label: string;
  error?: string;
  helperText?: string;
  as?: 'input' | 'textarea';
  showSuccess?: boolean;
}

export const FloatingInput: React.FC<FloatingInputProps> = ({
  label,
  error,
  helperText,
  as = 'input',
  showSuccess = false,
  className = '',
  id,
  value,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const inputId = id || `floating-input-${Math.random().toString(36).substr(2, 9)}`;

  useEffect(() => {
    setHasValue(!!(value && String(value).trim().length > 0));
  }, [value]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setIsFocused(true);
    onFocus?.(e as any);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setIsFocused(false);
    onBlur?.(e as any);
  };

  const isActive = isFocused || hasValue;
  const InputComponent = as;

  const baseStyles = `
    w-full rounded-lg border bg-black/40 px-3 text-white
    focus:outline-none transition-all duration-300
    disabled:opacity-50 disabled:cursor-not-allowed
    ${error 
      ? 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
      : showSuccess && hasValue && !error
      ? 'border-emerald-500/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
      : 'border-white/10 focus:border-accent focus:ring-2 focus:ring-accent/20'
    }
    ${as === 'textarea' ? 'py-3 resize-none' : 'py-3'}
    ${isActive ? 'pt-5 pb-1' : ''}
    ${className}
  `;

  return (
    <div className="relative w-full">
      <div className="relative">
        <InputComponent
          ref={inputRef as any}
          id={inputId}
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={baseStyles}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...(props as any)}
        />
        
        {/* Floating Label */}
        <motion.label
          htmlFor={inputId}
          className={`absolute left-3 pointer-events-none transition-colors duration-300 ${
            isActive
              ? 'top-2 text-xs text-gray-400'
              : 'top-1/2 -translate-y-1/2 text-base text-gray-500'
          } ${error ? 'text-red-400' : isFocused ? 'text-accent' : ''}`}
          animate={prefersReducedMotion ? {} : {
            y: isActive ? 0 : 0,
            scale: isActive ? 0.85 : 1,
          }}
          transition={{ duration: 0.2, ease: [0.19, 1, 0.22, 1] }}
        >
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </motion.label>

        {/* Success Icon */}
        {showSuccess && hasValue && !error && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 pointer-events-none"
            aria-hidden="true"
          >
            <CheckCircle2 className="w-5 h-5" />
          </motion.div>
        )}

        {/* Error Icon */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 pointer-events-none"
            aria-hidden="true"
          >
            <AlertCircle className="w-5 h-5" />
          </motion.div>
        )}
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.p
            id={`${inputId}-error`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-1.5 text-sm text-red-400 flex items-center gap-1.5"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </motion.p>
        )}
      </AnimatePresence>

      {/* Helper Text */}
      {helperText && !error && (
        <p id={`${inputId}-helper`} className="mt-1.5 text-sm text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
};
