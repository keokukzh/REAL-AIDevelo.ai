import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, X } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface FloatingActionButtonProps {
  onClick: () => void;
  className?: string;
  label?: string;
}

/**
 * Floating Action Button Component
 * Prominent button for primary actions on mobile
 */
export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  className = '',
  label = 'Contact',
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.button
      whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
      whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
      onClick={onClick}
      className={`md:hidden fixed bottom-24 right-4 z-50 bg-swiss-red hover:bg-red-700 text-white p-4 rounded-full shadow-lg shadow-swiss-red/30 transition-all focus-visible:ring-2 focus-visible:ring-swiss-red focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 min-h-[56px] min-w-[56px] flex items-center justify-center gap-2 ${className}`}
      aria-label={label}
    >
      <Mail size={20} aria-hidden="true" />
      <span className="font-semibold text-sm hidden sm:inline">{label}</span>
    </motion.button>
  );
};
