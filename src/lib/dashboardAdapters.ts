import { DashboardOverview } from '../hooks/useDashboardOverview';

export interface ChartDataPoint {
  name: string;
  calls: number;
}

export interface KPIMetrics {
  totalCalls: number;
  appointmentsBooked: number;
  missedCalls: number;
  avgDuration: string;
  totalCallsTrend?: string;
  appointmentsTrend?: string;
  missedCallsTrend?: string;
  avgDurationTrend?: string;
}

export interface TableRowData {
  id: string;
  caller: string;
  duration: string;
  status: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  timestamp: string;
  summary?: string;
}

/**
 * Maps recent calls to chart data points (grouped by hour for last 24 hours)
 */
export function mapCallsToChartData(calls: DashboardOverview['recent_calls']): ChartDataPoint[] {
  if (!calls || calls.length === 0) {
    // Return empty chart data for last 24 hours
    const hours = Array.from({ length: 24 }, (_, i) => {
      const hour = String(i).padStart(2, '0');
      return { name: `${hour}:00`, calls: 0 };
    });
    return hours;
  }

  // Group calls by actual hour of day (last 24 hours)
  const now = new Date();
  const hourMap = new Map<string, number>();
  
  // Initialize all hours to 0
  for (let i = 0; i < 24; i++) {
    const hour = String(i).padStart(2, '0');
    hourMap.set(`${hour}:00`, 0);
  }

  // Count calls per hour using actual hour of day from timestamp
  calls.forEach(call => {
    if (call.started_at) {
      const callDate = new Date(call.started_at);
      const hoursAgo = Math.floor((now.getTime() - callDate.getTime()) / (1000 * 60 * 60));
      
      // Only include calls from the last 24 hours
      if (hoursAgo >= 0 && hoursAgo < 24) {
        // Use actual hour of day from the call's timestamp (0-23)
        const hourOfDay = callDate.getHours();
        const hour = String(hourOfDay).padStart(2, '0');
        const key = `${hour}:00`;
        hourMap.set(key, (hourMap.get(key) || 0) + 1);
      }
    }
  });

  // Convert to array
  return Array.from(hourMap.entries()).map(([name, calls]) => ({ name, calls }));
}

/**
 * Maps dashboard overview to KPI metrics
 */
export function mapOverviewToKPIs(overview: DashboardOverview): KPIMetrics {
  const calls = overview.recent_calls || [];
  const totalCalls = calls.length;
  
  // Count missed calls (outcome === 'missed' or status indicates missed)
  const missedCalls = calls.filter(call => 
    call.outcome === 'missed' || call.outcome === 'failed'
  ).length;

  // Calculate average duration
  const durations = calls
    .filter(call => call.duration_sec !== null && call.duration_sec > 0)
    .map(call => call.duration_sec!);
  
  const avgDurationSec = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;
  
  const avgDuration = formatDuration(avgDurationSec);

  // Appointments booked - this would come from calendar integration
  // For now, we'll estimate based on calls that might have resulted in bookings
  // This is a placeholder - in real implementation, this would come from calendar API
  // Note: Calendar integration would provide this data via a separate API endpoint
  const appointmentsBooked = 0;

  return {
    totalCalls,
    appointmentsBooked,
    missedCalls,
    avgDuration,
  };
}

/**
 * Formats duration in seconds to human-readable string (e.g., "2m 14s")
 */
function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Maps a call log entry to table row data format
 */
export function mapCallToTableRow(call: DashboardOverview['recent_calls'][0]): TableRowData {
  const duration = call.duration_sec !== null && call.duration_sec > 0
    ? formatDuration(call.duration_sec)
    : '0s';

  // Determine status
  let status = 'completed';
  if (call.outcome === 'missed' || call.outcome === 'failed') {
    status = 'missed';
  } else if (call.outcome === 'voicemail') {
    status = 'voicemail';
  }
  // Default is already 'completed', so no need for explicit else if

  // Format timestamp
  const timestamp = call.started_at
    ? new Date(call.started_at).toLocaleTimeString('de-CH', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    : '';

  // Format caller number
  const caller = call.from_e164 || call.to_e164 || 'Unbekannt';

  return {
    id: call.id,
    caller,
    duration,
    status,
    timestamp,
    summary: undefined, // Not available in current data structure
  };
}
