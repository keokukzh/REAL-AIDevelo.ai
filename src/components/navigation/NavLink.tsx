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
    ? 'text-sm font-medium text-gray-300 hover:text-white transition-colors cursor-pointer'
    : 'px-3 py-2 rounded-lg text-xs text-gray-400 hover:bg-slate-800/70 hover:text-white transition-all duration-200 border border-slate-700/50 hover:border-slate-600';

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
        aria-label={ariaLabel || label}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`${baseClasses} ${className}`}
      aria-label={ariaLabel || label}
    >
      {content}
    </button>
  );
};
