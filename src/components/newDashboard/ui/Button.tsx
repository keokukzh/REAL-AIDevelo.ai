import React from 'react';
import { motion } from 'framer-motion';

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

  const buttonProps: React.ButtonHTMLAttributes<HTMLButtonElement> = {
    className: `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`,
    disabled: isDisabled,
    ...(ariaLabel && { 'aria-label': ariaLabel }),
    ...props,
  };

  if (isDisabled) {
    buttonProps['aria-disabled'] = true;
  }
  if (isLoading) {
    buttonProps['aria-busy'] = true;
  }

  return (
    <button {...buttonProps}>
      {isLoading ? (
        <>
          <span className="sr-only">Loading</span>
          <div className="mr-2 h-4 w-4 relative overflow-hidden rounded-sm">
            <motion.div
              className="absolute inset-0 bg-current opacity-30"
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
              className="absolute inset-0 bg-gradient-to-r from-transparent via-current to-transparent opacity-50"
              animate={{ x: ['-100%', '100%'] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
          </div>
        </>
      ) : null}
      {children}
    </button>
  );
};
