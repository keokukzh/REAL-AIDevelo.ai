import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'outline';
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', children, className = '', icon, ...props }) => {
  const baseStyles = "relative inline-flex items-center justify-center px-8 py-4 overflow-hidden font-semibold rounded-full transition-all duration-300 group z-10";
  
  // Check if custom background color is provided in className
  const hasCustomBg = className.includes('bg-');
  const hasCustomText = className.includes('text-');
  
  const variants = {
    primary: hasCustomBg 
      ? "" // Don't apply default primary styles if custom bg is provided
      : "bg-white text-black hover:bg-gray-100 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_35px_rgba(0,224,255,0.4)] border border-transparent",
    secondary: "bg-primary/10 text-white border border-primary/20 hover:bg-primary/20 hover:border-accent/50 shadow-[0_0_15px_rgba(26,115,232,0.1)] hover:shadow-[0_0_25px_rgba(26,115,232,0.3)]",
    outline: "bg-transparent text-white border-2 border-white/40 hover:border-white/70 hover:bg-white/10 backdrop-blur-sm shadow-sm hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]"
  };

  // Ensure text color is set if custom bg but no text color
  const defaultTextColor = hasCustomBg && !hasCustomText ? "text-white" : "";

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${defaultTextColor} ${className}`}
      {...props}
    >
      {variant === 'primary' && !hasCustomBg && (
        <span className="absolute inset-0 w-full h-full rounded-full opacity-10 bg-gradient-to-b from-transparent via-transparent to-gray-300 pointer-events-none"></span>
      )}
      <span className="relative flex items-center gap-2 z-10">
        {children}
        {icon && <span className="transition-transform group-hover:translate-x-1">{icon}</span>}
      </span>
    </motion.button>
  );
};