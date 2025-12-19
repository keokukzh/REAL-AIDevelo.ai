import React from 'react';
import { motion } from 'framer-motion';
import { useNavigation } from '../../hooks/useNavigation';

interface NavLinkProps {
  to: string;
  label: string;
  variant?: 'link' | 'button';
  onClick?: () => void;
  scrollToTop?: boolean;
  className?: string;
  ariaLabel?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Reusable navigation link component
 * Provides consistent navigation behavior across the application
 */
export const NavLink: React.FC<NavLinkProps> = ({
  to,
  label,
  variant = 'link',
  onClick,
  scrollToTop = false,
  className = '',
  ariaLabel,
  icon,
  children,
}) => {
  const nav = useNavigation();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    nav.goTo(to, scrollToTop);
    onClick?.();
  };

  const baseClasses = variant === 'link'
    ? 'text-sm font-medium text-gray-300 hover:text-white transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background rounded px-1'
    : 'px-3 py-2 rounded-lg text-xs text-gray-400 hover:bg-slate-800/70 hover:text-white transition-all duration-200 border border-slate-700/50 hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background min-h-[44px] min-w-[44px] flex items-center justify-center';

  const content = (
    <>
      {icon && <span className="mr-2">{icon}</span>}
      {label}
      {children}
    </>
  );

  if (variant === 'link') {
    return (
      <motion.a
        href={to}
        onClick={handleClick}
        className={`${baseClasses} ${className}`}
        whileHover={{ scale: 1.05, color: '#fff' }}
        whileFocus={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={ariaLabel || label}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.button
      onClick={handleClick}
      className={`${baseClasses} ${className}`}
      aria-label={ariaLabel || label}
      whileHover={{ scale: 1.05 }}
      whileFocus={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {content}
    </motion.button>
  );
};
