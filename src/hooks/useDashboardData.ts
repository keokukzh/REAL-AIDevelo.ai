import { useMemo, useRef } from 'react';
import { useDashboardOverview } from './useDashboardOverview.js';
import { useCalendarEvents } from './useCalendarEvents.js';
import { startOfDay, endOfDay, addDays } from 'date-fns';
import {
  mapCallsToChartData,
  mapOverviewToKPIs,
  mapCallToTableRow,
} from '../lib/dashboardAdapters.js';

/**
 * Custom hook for dashboard data fetching and transformation
 * Consolidates data fetching logic from DashboardPage
 */
export const useDashboardData = () => {
  const { data: overview, isLoading, error, refetch } = useDashboardOverview();

  // Calculate date range for calendar events
  const today = new Date();
  const todayDateString = today.toDateString();
  const weekEnd = useMemo(() => addDays(new Date(todayDateString), 7), [todayDateString]);

  // Determine if calendar is connected
  const calendarConnected = overview?.status?.calendar === 'connected';

  // Fetch calendar events
  const { events: calendarEvents, isLoading: isLoadingEvents } = useCalendarEvents({
    locationId: overview?.location?.id || '',
    start: startOfDay(today),
    end: endOfDay(weekEnd),
    enabled: calendarConnected && !!overview?.location?.id,
  });

  // Transform data for UI
  const kpis = useMemo(
    () =>
      overview
        ? mapOverviewToKPIs(overview)
        : {
            totalCalls: 0,
            appointmentsBooked: 0,
            missedCalls: 0,
            avgDuration: '0s',
            savedTime: '0s',
            efficiency: '100%',
          },
    [overview],
  );

  const chartData = useMemo(
    () => (overview?.recent_calls ? mapCallsToChartData(overview.recent_calls) : []),
    [overview?.recent_calls],
  );

  const recentCallsTableData = useMemo(
    () => (overview?.recent_calls ? overview.recent_calls.map(mapCallToTableRow) : []),
    [overview?.recent_calls],
  );

  // Get upcoming events (next 5)
  const nowRef = useRef(new Date());
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    // Update ref if more than a minute has passed
    if (now.getTime() - nowRef.current.getTime() > 60000) {
      nowRef.current = now;
    }
    return calendarEvents
      .filter((event) => new Date(event.start) >= nowRef.current)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 5);
  }, [calendarEvents]);

  return {
    overview,
    isLoading,
    error,
    refetch,
    kpis,
    chartData,
    recentCallsTableData,
    calendarEvents,
    upcomingEvents,
    isLoadingEvents,
    todayDateString,
    calendarConnected,
  };
};
