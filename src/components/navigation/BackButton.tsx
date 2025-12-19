import React from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useNavigation } from '../../hooks/useNavigation';
import { getRouteMeta } from '../../config/navigation';
import { motion } from 'framer-motion';

interface BackButtonProps {
  label?: string;
  to?: string;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'ghost' | 'link';
}

/**
 * Back button component for contextual navigation
 * Provides consistent back navigation with smart fallback
 */
export const BackButton: React.FC<BackButtonProps> = ({
  label,
  to,
  onClick,
  className = '',
  variant = 'default',
}) => {
  const location = useLocation();
  const nav = useNavigation();

  // Determine where to navigate back to
  const backPath = React.useMemo(() => {
    if (to) return to;
    
    // Try to get parent route from metadata
    const meta = getRouteMeta(location.pathname);
    if (meta?.parent) {
      return meta.parent;
    }
    
    // Fallback: navigate to dashboard if on dashboard sub-page
    if (location.pathname.startsWith('/dashboard/')) {
      return '/dashboard';
    }
    
    // Fallback: navigate to home
    return '/';
  }, [to, location.pathname]);

  // Determine label
  const buttonLabel = React.useMemo(() => {
    if (label) return label;
    
    const meta = getRouteMeta(backPath);
    if (meta) {
      return `Zurück zu ${meta.breadcrumb}`;
    }
    
    return 'Zurück';
  }, [label, backPath]);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      nav.goTo(backPath, true);
    }
  };

  const baseClasses = {
    default: 'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 border border-white/10 hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background',
    ghost: 'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background',
    link: 'flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background',
  };

  return (
    <motion.button
      onClick={handleClick}
      className={`${baseClasses[variant]} ${className}`}
      aria-label={buttonLabel}
      whileHover={{ scale: 1.02, x: -2 }}
      whileTap={{ scale: 0.98 }}
      whileFocus={{ scale: 1.02 }}
    >
      <ArrowLeft size={16} aria-hidden="true" />
      <span>{buttonLabel}</span>
    </motion.button>
  );
};
