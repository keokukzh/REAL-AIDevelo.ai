/**
 * Notification types and interfaces for the Notification Center
 */

export type NotificationPriority = 'critical' | 'important' | 'info';

export type NotificationCategory = 'calls' | 'system' | 'settings' | 'calendar' | 'phone' | 'agent' | 'success';

export interface Notification {
  id: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  category: NotificationCategory;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  icon?: string;
  autoDismiss?: boolean;
  dismissAfter?: number; // milliseconds
}

export interface NotificationFilters {
  category?: NotificationCategory | 'all';
  priority?: NotificationPriority | 'all';
  read?: boolean | 'all';
}
