import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'outline';
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', children, className = '', icon, ...props }) => {
  const baseStyles = "relative inline-flex items-center justify-center px-8 py-4 overflow-hidden font-semibold rounded-full transition-all duration-300 group";
  
  const variants = {
    primary: "bg-white text-black hover:bg-gray-100 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_35px_rgba(0,224,255,0.4)] border border-transparent",
    secondary: "bg-primary/10 text-white border border-primary/20 hover:bg-primary/20 hover:border-accent/50 shadow-[0_0_15px_rgba(26,115,232,0.1)] hover:shadow-[0_0_25px_rgba(26,115,232,0.3)]",
    outline: "bg-transparent text-white border border-white/20 hover:border-white/50 backdrop-blur-sm hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {variant === 'primary' && (
        <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-gray-200"></span>
      )}
      <span className="relative flex items-center gap-2">
        {children}
        {icon && <span className="transition-transform group-hover:translate-x-1">{icon}</span>}
      </span>
    </motion.button>
  );
};