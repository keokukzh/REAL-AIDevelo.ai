/**
 * DateTime Utilities
 * Timezone-safe date/time operations for Europe/Zurich
 */

const DEFAULT_TIMEZONE = 'Europe/Zurich';

/**
 * Parse ISO date string and convert to Date in timezone
 */
export function parseISODateTime(isoString: string, timezone: string = DEFAULT_TIMEZONE): Date {
  // If ISO string already has timezone, parse directly
  if (isoString.includes('+') || isoString.includes('Z') || isoString.match(/[+-]\d{2}:\d{2}$/)) {
    return new Date(isoString);
  }

  // If no timezone, assume it's in the specified timezone
  // Create a date string with timezone offset
  const date = new Date(isoString);
  
  // Get timezone offset for the specified timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  const hour = parts.find(p => p.type === 'hour')?.value;
  const minute = parts.find(p => p.type === 'minute')?.value;
  const second = parts.find(p => p.type === 'second')?.value;

  // Create ISO string with timezone
  const isoWithTz = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  
  // Use Intl to get offset
  const offset = getTimezoneOffset(timezone, date);
  const offsetHours = Math.floor(Math.abs(offset) / 60);
  const offsetMinutes = Math.abs(offset) % 60;
  const offsetSign = offset >= 0 ? '+' : '-';
  const offsetString = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;

  return new Date(`${isoWithTz}${offsetString}`);
}

/**
 * Get timezone offset in minutes for a given timezone at a specific date
 */
function getTimezoneOffset(timezone: string, date: Date): number {
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60);
}

/**
 * Format date to ISO string with timezone
 */
export function formatISODateTime(date: Date, timezone: string = DEFAULT_TIMEZONE): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  const hour = parts.find(p => p.type === 'hour')?.value;
  const minute = parts.find(p => p.type === 'minute')?.value;
  const second = parts.find(p => p.type === 'second')?.value;

  const offset = getTimezoneOffset(timezone, date);
  const offsetHours = Math.floor(Math.abs(offset) / 60);
  const offsetMinutes = Math.abs(offset) % 60;
  const offsetSign = offset >= 0 ? '+' : '-';
  const offsetString = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;

  return `${year}-${month}-${day}T${hour}:${minute}:${second}${offsetString}`;
}

/**
 * Format date to human-readable label (e.g., "Di, 16.12 10:00–10:30")
 */
export function formatDateTimeLabel(start: Date, end: Date, timezone: string = DEFAULT_TIMEZONE): string {
  const startFormatter = new Intl.DateTimeFormat('de-CH', {
    timeZone: timezone,
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const endFormatter = new Intl.DateTimeFormat('de-CH', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
  });

  const startStr = startFormatter.format(start);
  const endStr = endFormatter.format(end);

  return `${startStr}–${endStr}`;
}

/**
 * Parse date string (YYYY-MM-DD) and build start/end from business hours
 */
export function buildDateRangeFromBusinessHours(
  dateStr: string,
  businessHours: { from: string; to: string },
  timezone: string = DEFAULT_TIMEZONE
): { start: Date; end: Date } {
  const [fromHour, fromMinute] = businessHours.from.split(':').map(Number);
  const [toHour, toMinute] = businessHours.to.split(':').map(Number);

  const startISO = `${dateStr}T${String(fromHour).padStart(2, '0')}:${String(fromMinute).padStart(2, '0')}:00`;
  const endISO = `${dateStr}T${String(toHour).padStart(2, '0')}:${String(toMinute).padStart(2, '0')}:00`;

  const start = parseISODateTime(startISO, timezone);
  const end = parseISODateTime(endISO, timezone);

  return { start, end };
}

/**
 * Generate time slots from busy intervals
 */
export function generateSlots(
  start: Date,
  end: Date,
  busyIntervals: Array<{ start: string; end: string }>,
  slotMinutes: number,
  minNoticeMinutes: number,
  maxResults: number,
  timezone: string = DEFAULT_TIMEZONE
): Array<{ start: Date; end: Date; label: string }> {
  const slots: Array<{ start: Date; end: Date; label: string }> = [];
  const now = new Date();
  const minStart = new Date(now.getTime() + minNoticeMinutes * 60 * 1000);

  // Parse busy intervals
  const busy = busyIntervals.map(b => ({
    start: new Date(b.start),
    end: new Date(b.end),
  })).sort((a, b) => a.start.getTime() - b.start.getTime());

  // Generate slots
  let current = new Date(Math.max(start.getTime(), minStart.getTime()));
  const slotMs = slotMinutes * 60 * 1000;

  while (current.getTime() + slotMs <= end.getTime() && slots.length < maxResults) {
    const slotEnd = new Date(current.getTime() + slotMs);

    // Check if slot overlaps with any busy interval
    const isBusy = busy.some(b => {
      return (
        (current.getTime() >= b.start.getTime() && current.getTime() < b.end.getTime()) ||
        (slotEnd.getTime() > b.start.getTime() && slotEnd.getTime() <= b.end.getTime()) ||
        (current.getTime() <= b.start.getTime() && slotEnd.getTime() >= b.end.getTime())
      );
    });

    if (!isBusy) {
      slots.push({
        start: new Date(current),
        end: new Date(slotEnd),
        label: formatDateTimeLabel(current, slotEnd, timezone),
      });
    }

    current = new Date(current.getTime() + slotMs);
  }

  return slots;
}
