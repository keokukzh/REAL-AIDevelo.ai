import { useEffect, useRef } from 'react';
import { useNotifications } from '../contexts/NotificationContext.js';
import { DashboardOverview } from './useDashboardOverview.js';

interface UseSuccessNotificationsOptions {
  overview: DashboardOverview | undefined;
  previousOverview: DashboardOverview | undefined;
}

/**
 * Hook for generating success notifications for milestones and achievements
 */
export const useSuccessNotifications = ({
  overview,
  previousOverview,
}: UseSuccessNotificationsOptions) => {
  const { addNotification } = useNotifications();
  const milestoneRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!overview || !previousOverview) return;

    const totalCalls = overview.recent_calls?.length || 0;
    const previousTotalCalls = previousOverview.recent_calls?.length || 0;

    // Check for milestone achievements
    const milestones = [1, 10, 25, 50, 100, 250, 500, 1000];

    milestones.forEach((milestone) => {
      if (
        totalCalls >= milestone &&
        previousTotalCalls < milestone &&
        !milestoneRef.current.has(milestone)
      ) {
        addNotification({
          title: `🎉 ${milestone} Anrufe erreicht!`,
          message: `Herzlichen Glückwunsch! Sie haben ${milestone} Anrufe erfolgreich bearbeitet.`,
          priority: 'info',
          category: 'success',
          autoDismiss: true,
          dismissAfter: 10000, // 10 seconds
          icon: 'success',
        });
        milestoneRef.current.add(milestone);
      }
    });

    // First call achievement
    if (totalCalls === 1 && previousTotalCalls === 0) {
      addNotification({
        title: '🎉 Erster Anruf erfolgreich bearbeitet!',
        message: 'Ihr Voice Agent hat den ersten Anruf erfolgreich bearbeitet. Großartig!',
        priority: 'info',
        category: 'success',
        autoDismiss: true,
        dismissAfter: 10000,
        icon: 'success',
      });
    }

    // Check for successful calendar connection (if it changed from not_connected to connected)
    if (
      overview.status.calendar === 'connected' &&
      previousOverview.status.calendar === 'not_connected'
    ) {
      addNotification({
        title: '✅ Kalender erfolgreich verbunden',
        message: 'Ihr Kalender wurde erfolgreich verbunden. Termine können jetzt automatisch verwaltet werden.',
        priority: 'info',
        category: 'success',
        autoDismiss: true,
        dismissAfter: 8000,
        icon: 'success',
      });
    }

    // Check for successful phone connection (if it changed from not_connected to connected)
    if (
      overview.status.phone === 'connected' &&
      previousOverview.status.phone === 'not_connected'
    ) {
      addNotification({
        title: '✅ Telefon erfolgreich verbunden',
        message: 'Ihre Telefonnummer wurde erfolgreich verbunden. Der Voice Agent kann jetzt Anrufe entgegennehmen.',
        priority: 'info',
        category: 'success',
        autoDismiss: true,
        dismissAfter: 8000,
        icon: 'success',
      });
    }

    // Check for agent becoming ready (if it changed from needs_setup to ready)
    if (
      overview.status.agent === 'ready' &&
      previousOverview.status.agent === 'needs_setup'
    ) {
      addNotification({
        title: '✅ Agent erfolgreich aktiviert',
        message: 'Ihr Voice Agent ist jetzt bereit und kann Anrufe entgegennehmen!',
        priority: 'info',
        category: 'success',
        autoDismiss: true,
        dismissAfter: 8000,
        icon: 'success',
      });
    }
  }, [overview, previousOverview, addNotification]);
};
