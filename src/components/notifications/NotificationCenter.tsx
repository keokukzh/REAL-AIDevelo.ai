import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  X,
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  Phone,
  Calendar,
  Settings,
  Zap,
  Filter,
  CheckCheck,
  Trash2,
} from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext.js';
import { Notification, NotificationCategory, NotificationPriority } from '../../types/notifications.js';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const priorityIcons = {
  critical: AlertTriangle,
  important: AlertCircle,
  info: Info,
};

const categoryIcons: Record<NotificationCategory, React.ElementType> = {
  calls: Phone,
  system: Zap,
  settings: Settings,
  calendar: Calendar,
  phone: Phone,
  agent: Zap,
  success: CheckCircle2,
};

const priorityColors = {
  critical: 'text-red-400 bg-red-500/10 border-red-500/20',
  important: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  info: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
};

/**
 * Notification Center Component
 * Central place for all notifications with filtering and management
 */
export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    getFilteredNotifications,
  } = useNotifications();

  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<NotificationPriority | 'all'>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const filteredNotifications = useMemo(() => {
    return getFilteredNotifications({
      category: selectedCategory,
      priority: selectedPriority,
      read: showUnreadOnly ? false : 'all',
    });
  }, [notifications, selectedCategory, selectedPriority, showUnreadOnly, getFilteredNotifications]);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      globalThis.window.location.href = notification.actionUrl;
    }
  };

  const categories: Array<{ value: NotificationCategory | 'all'; label: string; icon: React.ElementType }> = [
    { value: 'all', label: 'Alle', icon: Bell },
    { value: 'calls', label: 'Anrufe', icon: Phone },
    { value: 'system', label: 'System', icon: Zap },
    { value: 'calendar', label: 'Kalender', icon: Calendar },
    { value: 'phone', label: 'Telefon', icon: Phone },
    { value: 'agent', label: 'Agent', icon: Zap },
    { value: 'success', label: 'Erfolg', icon: CheckCircle2 },
  ];

  const priorities: Array<{ value: NotificationPriority | 'all'; label: string }> = [
    { value: 'all', label: 'Alle' },
    { value: 'critical', label: 'Kritisch' },
    { value: 'important', label: 'Wichtig' },
    { value: 'info', label: 'Info' },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            aria-hidden="true"
          />

          {/* Notification Center Panel */}
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-slate-900/95 backdrop-blur-xl border-l border-slate-700/50 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-accent" />
                <h2 className="text-xl font-bold text-white">Benachrichtigungen</h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-accent/20 text-accent text-xs font-bold rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors text-gray-400 hover:text-white touch-manipulation"
                aria-label="Schließen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filters */}
            <div className="p-4 border-b border-slate-700/50 space-y-3">
              {/* Category Filter */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = selectedCategory === cat.value;
                  return (
                    <button
                      key={cat.value}
                      onClick={() => setSelectedCategory(cat.value)}
                      className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap
                        transition-all duration-200 touch-manipulation
                        ${isActive
                          ? 'bg-accent/20 text-accent border border-accent/30'
                          : 'bg-slate-800/50 text-gray-400 hover:bg-slate-800 hover:text-gray-300 border border-transparent'}
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Priority & Unread Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value as NotificationPriority | 'all')}
                    className="flex-1 px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    aria-label="Priorität filtern"
                  >
                    {priorities.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                  className={`
                    px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 touch-manipulation
                    ${showUnreadOnly
                      ? 'bg-accent/20 text-accent border border-accent/30'
                      : 'bg-slate-800/50 text-gray-400 hover:bg-slate-800 hover:text-gray-300 border border-transparent'}
                  `}
                >
                  Ungelesen
                </button>
              </div>

              {/* Actions */}
              {unreadCount > 0 && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-700/30">
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 hover:bg-slate-800 text-gray-400 hover:text-gray-300 rounded-lg text-sm font-medium transition-colors touch-manipulation"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>Alle als gelesen</span>
                  </button>
                </div>
              )}
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-600 mb-4" />
                  <p className="text-gray-400 font-medium">Keine Benachrichtigungen</p>
                  <p className="text-gray-500 text-sm mt-2">
                    {notifications.length === 0
                      ? 'Sie haben noch keine Benachrichtigungen.'
                      : 'Keine Benachrichtigungen entsprechen den Filtern.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800/50">
                  {filteredNotifications.map((notification) => {
                    const PriorityIcon = priorityIcons[notification.priority];
                    const CategoryIcon = categoryIcons[notification.category] || Info;
                    const timeAgo = formatDistanceToNow(notification.timestamp, {
                      addSuffix: true,
                      locale: de,
                    });

                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`
                          p-4 hover:bg-slate-800/30 transition-colors cursor-pointer
                          ${notification.read ? '' : 'bg-slate-800/10'}
                        `}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div
                            className={`
                              flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border
                              ${priorityColors[notification.priority]}
                            `}
                          >
                            <PriorityIcon className="w-5 h-5" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <CategoryIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                <h3
                                  className={`
                                    text-sm font-semibold truncate
                                    ${notification.read ? 'text-gray-300' : 'text-white'}
                                  `}
                                >
                                  {notification.title}
                                </h3>
                                {notification.read ? null : (
                                  <div className="w-2 h-2 bg-accent rounded-full flex-shrink-0" />
                                )}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeNotification(notification.id);
                                }}
                                className="p-1 rounded hover:bg-slate-700/50 text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0 touch-manipulation"
                                aria-label="Benachrichtigung löschen"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-sm text-gray-400 mb-2 line-clamp-2">{notification.message}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">{timeAgo}</span>
                              {notification.actionLabel && (
                                <span className="text-xs text-accent font-medium">{notification.actionLabel} →</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
