import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { Notification, NotificationFilters } from '../types/notifications.js';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  getFilteredNotifications: (filters?: NotificationFilters) => Notification[];
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const STORAGE_KEY = 'aidevelo_notifications';
const MAX_NOTIFICATIONS = 100; // Keep last 100 notifications

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    // Load from localStorage on mount
    if (globalThis.window !== undefined) {
      try {
        const stored = globalThis.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Convert timestamp strings back to Date objects
          return parsed.map((n: any) => ({
            ...n,
            timestamp: new Date(n.timestamp),
          }));
        }
      } catch (error) {
        console.error('[NotificationContext] Failed to load notifications from storage:', error);
      }
    }
    return [];
  });

  // Save to localStorage whenever notifications change
  useEffect(() => {
    if (globalThis.window !== undefined) {
      try {
        globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
      } catch (error) {
        console.error('[NotificationContext] Failed to save notifications to storage:', error);
      }
    }
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = useCallback(
    (notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
      const notification: Notification = {
        ...notificationData,
        id: `notification-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        timestamp: new Date(),
        read: false,
      };

      setNotifications((prev) => {
        const updated = [notification, ...prev];
        // Keep only the last MAX_NOTIFICATIONS
        return updated.slice(0, MAX_NOTIFICATIONS);
      });

      // Auto-dismiss if configured
      if (notification.autoDismiss && notification.dismissAfter) {
        setTimeout(() => {
          setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
        }, notification.dismissAfter);
      }
    },
    [],
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const getFilteredNotifications = useCallback(
    (filters?: NotificationFilters) => {
      let filtered = [...notifications];

      if (filters?.category && filters.category !== 'all') {
        filtered = filtered.filter((n) => n.category === filters.category);
      }

      if (filters?.priority && filters.priority !== 'all') {
        filtered = filtered.filter((n) => n.priority === filters.priority);
      }

      if (filters?.read !== undefined && filters.read !== 'all') {
        filtered = filtered.filter((n) => n.read === filters.read);
      }

      return filtered;
    },
    [notifications],
  );

  const contextValue = useMemo(
    () => ({
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      removeNotification,
      clearNotifications,
      getFilteredNotifications,
    }),
    [notifications, unreadCount, addNotification, markAsRead, markAllAsRead, removeNotification, clearNotifications, getFilteredNotifications],
  );

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
