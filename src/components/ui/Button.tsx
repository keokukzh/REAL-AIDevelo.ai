import React, { useRef, useState, useEffect } from 'react';
import { motion, HTMLMotionProps, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface ButtonProps extends Omit<HTMLMotionProps<"button">, 'children'> {
  variant?: 'primary' | 'secondary' | 'outline';
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  isLoading?: boolean;
  loadingLabel?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  children, 
  className = '', 
  icon,
  isLoading = false,
  loadingLabel = 'Loading...',
  disabled,
  ...props 
}) => {
  const prefersReducedMotion = useReducedMotion();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  // Magnetic effect values
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springConfig = { damping: 15, stiffness: 150 };
  const xSpring = useSpring(x, springConfig);
  const ySpring = useSpring(y, springConfig);
  
  // Transform for magnetic effect (max 8px movement)
  const xTransform = useTransform(xSpring, [-1, 1], [-8, 8]);
  const yTransform = useTransform(ySpring, [-1, 1], [-8, 8]);

  const baseStyles = "relative inline-flex items-center justify-center px-8 py-4 overflow-hidden font-semibold rounded-full transition-all duration-fast group z-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background";
  
  // Check if custom background color is provided in className
  const hasCustomBg = className.includes('bg-');
  const hasCustomText = className.includes('text-');
  
  const variants = {
    primary: hasCustomBg 
      ? "" // Don't apply default primary styles if custom bg is provided
      : "bg-white text-black hover:bg-gray-100 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_35px_rgba(0,224,255,0.4)] border border-transparent focus:ring-accent",
    secondary: "bg-primary/10 text-white border border-primary/20 hover:bg-primary/20 hover:border-accent/50 shadow-[0_0_15px_rgba(26,115,232,0.1)] hover:shadow-[0_0_25px_rgba(26,115,232,0.3)] focus:ring-primary",
    outline: "bg-transparent text-white border-2 border-white/40 hover:border-white/70 hover:bg-white/10 backdrop-blur-sm shadow-sm hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] focus:ring-white"
  };

  // Ensure text color is set if custom bg but no text color
  const defaultTextColor = hasCustomBg && !hasCustomText ? "text-white" : "";

  const isDisabled = disabled || isLoading;

  // Magnetic hover effect
  useEffect(() => {
    if (prefersReducedMotion || !isHovered || isDisabled) {
      x.set(0);
      y.set(0);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!buttonRef.current) return;
      
      const rect = buttonRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Normalize to -1 to 1 range
      const normalizedX = (e.clientX - centerX) / (rect.width / 2);
      const normalizedY = (e.clientY - centerY) / (rect.height / 2);
      
      // Clamp to prevent excessive movement
      x.set(Math.max(-1, Math.min(1, normalizedX * 0.5)));
      y.set(Math.max(-1, Math.min(1, normalizedY * 0.5)));
    };

    const handleMouseLeave = () => {
      x.set(0);
      y.set(0);
      setIsHovered(false);
    };

    globalThis.window.addEventListener('mousemove', handleMouseMove);
    buttonRef.current?.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      globalThis.window.removeEventListener('mousemove', handleMouseMove);
      buttonRef.current?.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isHovered, prefersReducedMotion, isDisabled, x, y]);

  // Animation variants respecting reduced motion
  const hoverScale = prefersReducedMotion ? 1 : 1.05;
  const tapScale = prefersReducedMotion ? 1 : 0.98;
  const magneticTransform = prefersReducedMotion || !isHovered 
    ? { x: 0, y: 0 }
    : { x: xTransform, y: yTransform };

  return (
    <motion.button
      ref={buttonRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        x.set(0);
        y.set(0);
      }}
      whileHover={prefersReducedMotion ? {} : { scale: hoverScale }}
      whileTap={prefersReducedMotion ? {} : { scale: tapScale }}
      style={magneticTransform}
      disabled={isDisabled}
      className={`${baseStyles} ${variants[variant]} ${defaultTextColor} ${className} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      aria-busy={isLoading}
      aria-disabled={isDisabled}
      {...props}
    >
      {/* Loading shimmer overlay */}
      {isLoading && (
        <span 
          className="absolute inset-0 button-shimmer pointer-events-none rounded-full"
          aria-hidden="true"
        />
      )}
      
      {/* Gradient overlay for primary variant */}
      {variant === 'primary' && !hasCustomBg && !isLoading && (
        <span className="absolute inset-0 w-full h-full rounded-full opacity-10 bg-gradient-to-b from-transparent via-transparent to-gray-300 pointer-events-none"></span>
      )}
      
      <span className="relative flex items-center gap-2 z-10">
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
            <span className="sr-only">{loadingLabel}</span>
            <span aria-hidden="true">{children}</span>
          </>
        ) : (
          <>
            {children}
            {icon && (
              <span className="transition-transform duration-fast group-hover:translate-x-1">
                {icon}
              </span>
            )}
          </>
        )}
      </span>
    </motion.button>
  );
};