import React from 'react';
import { Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNotifications } from '../../contexts/NotificationContext.js';

interface NotificationBellProps {
  onClick: () => void;
  className?: string;
}

/**
 * Notification Bell Component
 * Shows unread count badge and animates on new notifications
 */
export const NotificationBell: React.FC<NotificationBellProps> = ({ onClick, className = '' }) => {
  const { unreadCount } = useNotifications();

  return (
    <button
      onClick={onClick}
      className={`
        relative p-2 rounded-lg hover:bg-slate-800/50 transition-colors
        text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-slate-900
        touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center
        ${className}
      `}
      aria-label={unreadCount > 0 ? `Benachrichtigungen (${unreadCount} ungelesen)` : 'Benachrichtigungen'}
      aria-haspopup="true"
    >
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-slate-900"
        >
          <span className="text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        </motion.span>
      )}
      {unreadCount > 0 && (
        <motion.div
          className="absolute inset-0 rounded-lg bg-accent/20"
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
    </button>
  );
};
