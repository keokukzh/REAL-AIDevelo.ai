import { useEffect, useRef } from 'react';
import { useNotifications } from '../contexts/NotificationContext.js';
import { DashboardOverview } from './useDashboardOverview.js';

interface UseProactiveAlertsOptions {
  overview: DashboardOverview | undefined;
  phoneHealth: 'ok' | 'error' | 'warning';
  calendarHealth: 'ok' | 'error' | 'warning';
}

/**
 * Hook for generating proactive alerts based on system state
 */
export const useProactiveAlerts = ({
  overview,
  phoneHealth,
  calendarHealth,
}: UseProactiveAlertsOptions) => {
  const { addNotification } = useNotifications();
  const alertedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!overview) return;

    // Check Twilio Credits (if available in overview)
    // Note: This would need backend support to check actual credits
    // For now, we'll check phone health as a proxy

    // Phone Connection Issues
    if (phoneHealth === 'error' && !alertedRef.current.has('phone-error')) {
      addNotification({
        title: 'Telefon-Verbindung fehlgeschlagen',
        message: 'Die Verbindung zum Telefon-System konnte nicht hergestellt werden. Bitte überprüfen Sie Ihre Einstellungen.',
        priority: 'critical',
        category: 'phone',
        actionUrl: '/dashboard',
        actionLabel: 'Einstellungen öffnen',
        icon: 'phone',
      });
      alertedRef.current.add('phone-error');
    } else if (phoneHealth === 'ok' && alertedRef.current.has('phone-error')) {
      alertedRef.current.delete('phone-error');
    }

    // Phone Warning (needs compliance)
    if (phoneHealth === 'warning' && !alertedRef.current.has('phone-warning')) {
      addNotification({
        title: 'Telefon-Verbindung benötigt Aufmerksamkeit',
        message: 'Ihre Telefon-Verbindung benötigt möglicherweise Compliance-Einstellungen.',
        priority: 'important',
        category: 'phone',
        actionUrl: '/dashboard',
        actionLabel: 'Überprüfen',
        icon: 'phone',
      });
      alertedRef.current.add('phone-warning');
    } else if (phoneHealth !== 'warning' && alertedRef.current.has('phone-warning')) {
      alertedRef.current.delete('phone-warning');
    }

    // Calendar Sync Issues
    if (calendarHealth === 'error' && !alertedRef.current.has('calendar-error')) {
      addNotification({
        title: 'Kalender-Synchronisation fehlgeschlagen',
        message: 'Die Verbindung zu Ihrem Kalender konnte nicht hergestellt werden. Bitte verbinden Sie Ihren Kalender erneut.',
        priority: 'important',
        category: 'calendar',
        actionUrl: '/calendar',
        actionLabel: 'Kalender verbinden',
        icon: 'calendar',
      });
      alertedRef.current.add('calendar-error');
    } else if (calendarHealth === 'ok' && alertedRef.current.has('calendar-error')) {
      alertedRef.current.delete('calendar-error');
    }

    // Agent Inactivity Check
    if (overview.status.agent === 'ready' && overview.last_activity) {
      const lastActivity = new Date(overview.last_activity);
      const hoursSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60);

      // Alert if agent hasn't been active for 24+ hours
      if (hoursSinceActivity >= 24 && !alertedRef.current.has('agent-inactive-24h')) {
        addNotification({
          title: 'Agent seit 24 Stunden inaktiv',
          message: 'Ihr Voice Agent hat seit 24 Stunden keine Aktivität verzeichnet. Möchten Sie einen Testanruf durchführen?',
          priority: 'info',
          category: 'agent',
          actionUrl: '/dashboard',
          actionLabel: 'Testanruf starten',
          icon: 'agent',
        });
        alertedRef.current.add('agent-inactive-24h');
      } else if (hoursSinceActivity < 24 && alertedRef.current.has('agent-inactive-24h')) {
        alertedRef.current.delete('agent-inactive-24h');
      }

      // Alert if agent hasn't been active for 7+ days
      if (hoursSinceActivity >= 168 && !alertedRef.current.has('agent-inactive-7d')) {
        addNotification({
          title: 'Agent seit 7 Tagen inaktiv',
          message: 'Ihr Voice Agent hat seit einer Woche keine Aktivität verzeichnet. Überprüfen Sie die Einstellungen.',
          priority: 'important',
          category: 'agent',
          actionUrl: '/dashboard',
          actionLabel: 'Einstellungen prüfen',
          icon: 'agent',
        });
        alertedRef.current.add('agent-inactive-7d');
      } else if (hoursSinceActivity < 168 && alertedRef.current.has('agent-inactive-7d')) {
        alertedRef.current.delete('agent-inactive-7d');
      }
    }

    // Gateway Health Warning
    if (overview.gateway_health === 'warning' && !alertedRef.current.has('gateway-warning')) {
      addNotification({
        title: 'Gateway-Status: Warnung',
        message: 'Das Telefon-Gateway meldet Warnungen. Die Verbindung funktioniert möglicherweise eingeschränkt.',
        priority: 'important',
        category: 'system',
        actionUrl: '/dashboard',
        actionLabel: 'Details anzeigen',
        icon: 'system',
      });
      alertedRef.current.add('gateway-warning');
    } else if (overview.gateway_health !== 'warning' && alertedRef.current.has('gateway-warning')) {
      alertedRef.current.delete('gateway-warning');
    }
  }, [overview, phoneHealth, calendarHealth, addNotification]);
};
