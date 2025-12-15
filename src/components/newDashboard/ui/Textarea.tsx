import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCharacterCount?: boolean;
  maxLength?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    label, 
    error, 
    helperText, 
    showCharacterCount, 
    maxLength,
    size = 'md', 
    className = '', 
    id,
    value,
    onChange,
    ...props 
  }, ref) => {
    const inputId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;
    const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;

    const characterCount = typeof value === 'string' ? value.length : 0;

    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-base',
      lg: 'px-5 py-4 text-lg',
    };

    const baseStyles = `
      w-full bg-slate-800/50 border rounded-lg text-white placeholder-gray-500
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background
      disabled:opacity-50 disabled:cursor-not-allowed
      transition-colors resize-y
      ${sizeClasses[size]}
      ${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-700/50 focus:ring-accent'}
      ${className}
    `;

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={inputId} 
            className="block text-sm font-medium text-gray-300 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <textarea
            ref={ref}
            id={inputId}
            className={baseStyles}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={describedBy}
            maxLength={maxLength}
            value={value}
            onChange={onChange}
            {...props}
          />
          {error && (
            <div className="absolute right-3 top-3 text-red-400 pointer-events-none" aria-hidden="true">
              <AlertCircle className="w-5 h-5" />
            </div>
          )}
        </div>
        <div className="flex justify-between items-center mt-1.5">
          {error && (
            <p id={errorId} className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
          {helperText && !error && (
            <p id={helperId} className="text-sm text-gray-400">
              {helperText}
            </p>
          )}
          {showCharacterCount && maxLength && (
            <p className={`text-xs ml-auto ${characterCount > maxLength * 0.9 ? 'text-amber-400' : 'text-gray-500'}`}>
              {characterCount} / {maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
