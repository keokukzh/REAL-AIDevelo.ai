import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading,
  className = '',
  disabled,
  'aria-label': ariaLabel,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed rounded-md";
  
  const variants = {
    primary: "bg-swiss-red hover:bg-red-700 text-white focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-background shadow-sm shadow-red-900/20",
    secondary: "bg-slate-800 hover:bg-slate-700 text-white focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-background shadow-sm border border-slate-700/50",
    outline: "border border-slate-600 bg-transparent hover:bg-slate-800/50 text-gray-300 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-background",
    ghost: "hover:bg-slate-800/50 text-gray-300 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-background",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  const isDisabled = disabled || isLoading;

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isDisabled}
      aria-disabled={isDisabled || undefined}
      aria-busy={isLoading || undefined}
      aria-label={ariaLabel || (typeof children === 'string' ? undefined : ariaLabel)}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="sr-only">Loading</span>
          <svg 
            className="animate-spin h-4 w-4 text-current mr-2" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </>
      ) : null}
      {children}
    </button>
  );
};
