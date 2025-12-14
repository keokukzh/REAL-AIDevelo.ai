import { voiceAgentConfig } from '../config';
import axios from 'axios';
import { calendarService } from '../../services/calendarService';
import {
  parseISODateTime,
  formatISODateTime,
  formatDateTimeLabel,
  buildDateRangeFromBusinessHours,
  generateSlots,
} from '../../utils/dateTimeUtils';

/**
 * Calendar Tool
 * Handles Google Calendar and Outlook Calendar integration
 */

export interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  description?: string;
  attendees?: string[];
}

export interface CalendarAvailability {
  start: Date;
  end: Date;
  available: boolean;
}

export interface CheckAvailabilityInput {
  calendarId?: string;
  date?: string; // YYYY-MM-DD
  start?: string; // ISO 8601
  end?: string; // ISO 8601
  timezone?: string;
  slotMinutes?: number;
  businessHours?: { from: string; to: string };
  minNoticeMinutes?: number;
  maxResults?: number;
}

export interface CheckAvailabilityOutput {
  success: boolean;
  data?: {
    timezone: string;
    range: { start: string; end: string };
    slots: Array<{ start: string; end: string; label: string }>;
  };
  error?: string;
}

export interface CreateAppointmentInput {
  calendarId?: string;
  summary: string;
  start: string; // ISO 8601
  end: string; // ISO 8601
  timezone?: string;
  description?: string;
  attendees?: Array<{ email: string }>;
  location?: string;
}

export interface CreateAppointmentOutput {
  success: boolean;
  data?: {
    eventId: string;
    htmlLink: string;
    start: string;
    end: string;
    calendarId: string;
  };
  error?: string;
}

export class CalendarTool {
  private locationId: string;

  constructor(locationId: string) {
    this.locationId = locationId;
  }

  /**
   * Check availability in calendar
   * Returns available time slots
   */
  async checkAvailability(
    input: CheckAvailabilityInput,
    calendarType: 'google' | 'outlook' = 'google'
  ): Promise<CheckAvailabilityOutput> {
    try {
      const timezone = input.timezone || 'Europe/Zurich';
      const slotMinutes = input.slotMinutes || 30;
      const minNoticeMinutes = input.minNoticeMinutes || 60;
      const maxResults = input.maxResults || 10;
      const calendarId = input.calendarId || 'primary';

      // Determine start/end
      let start: Date;
      let end: Date;

      if (input.start && input.end) {
        start = parseISODateTime(input.start, timezone);
        end = parseISODateTime(input.end, timezone);
      } else if (input.date && input.businessHours) {
        const range = buildDateRangeFromBusinessHours(input.date, input.businessHours, timezone);
        start = range.start;
        end = range.end;
      } else if (input.date) {
        // Default business hours 09:00-17:00
        const range = buildDateRangeFromBusinessHours(input.date, { from: '09:00', to: '17:00' }, timezone);
        start = range.start;
        end = range.end;
      } else {
        return {
          success: false,
          error: 'Invalid time range: provide start/end or date with optional businessHours',
        };
      }

      // Validate time range
      if (start >= end) {
        return {
          success: false,
          error: 'Invalid time range: start must be before end',
        };
      }

      // Refresh token if needed
      const accessToken = await calendarService.refreshTokenIfNeeded(this.locationId, calendarType);

      if (calendarType === 'google') {
        // Google Calendar freebusy API
        const response = await axios.post(
          'https://www.googleapis.com/calendar/v3/freeBusy',
          {
            timeMin: start.toISOString(),
            timeMax: end.toISOString(),
            items: [{ id: calendarId }],
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        // Parse busy intervals
        const busyIntervals = response.data.calendars?.[calendarId]?.busy || [];

        // Generate available slots
        const slots = generateSlots(
          start,
          end,
          busyIntervals,
          slotMinutes,
          minNoticeMinutes,
          maxResults,
          timezone
        );

        return {
          success: true,
          data: {
            timezone,
            range: {
              start: formatISODateTime(start, timezone),
              end: formatISODateTime(end, timezone),
            },
            slots: slots.map(slot => ({
              start: formatISODateTime(slot.start, timezone),
              end: formatISODateTime(slot.end, timezone),
              label: slot.label,
            })),
          },
        };
      } else {
        // Outlook Calendar API integration would go here
        return {
          success: false,
          error: 'Outlook calendar not yet implemented',
        };
      }
    } catch (error: any) {
      if (error.message?.includes('Calendar not connected')) {
        return {
          success: false,
          error: 'Calendar not connected',
        };
      }
      if (error.response?.data?.error) {
        return {
          success: false,
          error: `Google API error: ${error.response.data.error.message || error.response.data.error}`,
        };
      }
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Create calendar appointment/event
   */
  async createAppointment(
    input: CreateAppointmentInput,
    calendarType: 'google' | 'outlook' = 'google'
  ): Promise<CreateAppointmentOutput> {
    try {
      const calendarId = input.calendarId || 'primary';
      const timezone = input.timezone || 'Europe/Zurich';

      // Parse and validate dates
      const start = parseISODateTime(input.start, timezone);
      const end = parseISODateTime(input.end, timezone);

      if (start >= end) {
        return {
          success: false,
          error: 'Invalid time range: start must be before end',
        };
      }

      // Refresh token if needed
      const accessToken = await calendarService.refreshTokenIfNeeded(this.locationId, calendarType);

      if (calendarType === 'google') {
        // Google Calendar events.insert API
        const response = await axios.post(
          `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
          {
            summary: input.summary,
            description: input.description || '',
            start: {
              dateTime: formatISODateTime(start, timezone),
              timeZone: timezone,
            },
            end: {
              dateTime: formatISODateTime(end, timezone),
              timeZone: timezone,
            },
            attendees: input.attendees || [],
            location: input.location || '',
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        return {
          success: true,
          data: {
            eventId: response.data.id,
            htmlLink: response.data.htmlLink || '',
            start: formatISODateTime(start, timezone),
            end: formatISODateTime(end, timezone),
            calendarId,
          },
        };
      } else {
        // Outlook Calendar API call would go here
        return {
          success: false,
          error: 'Outlook calendar not yet implemented',
        };
      }
    } catch (error: any) {
      if (error.message?.includes('Calendar not connected')) {
        return {
          success: false,
          error: 'Calendar not connected',
        };
      }
      if (error.response?.data?.error) {
        return {
          success: false,
          error: `Google API error: ${error.response.data.error.message || error.response.data.error}`,
        };
      }
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Create calendar event (legacy method, kept for backward compatibility)
   * @deprecated Use createAppointment() instead
   */
  async createEvent(
    event: CalendarEvent,
    calendarType: 'google' | 'outlook' = 'google'
  ): Promise<{ success: boolean; eventId?: string; error?: string }> {
    const result = await this.createAppointment(
      {
        summary: event.title,
        start: event.start.toISOString(),
        end: event.end.toISOString(),
        description: event.description,
        attendees: event.attendees?.map(email => ({ email })),
      },
      calendarType
    );

    if (result.success && result.data) {
      return { success: true, eventId: result.data.eventId };
    }
    return { success: false, error: result.error };
  }

  /**
   * List upcoming events
   */
  async listEvents(
    start: Date,
    end: Date,
    calendarType: 'google' | 'outlook' = 'google'
  ): Promise<CalendarEvent[]> {
    // Placeholder implementation
    return [];
  }

  /**
   * Get tool definition for LLM
   */
  static getToolDefinition() {
    return {
      name: 'calendar',
      description: 'Manage calendar events and check availability. Can check availability slots and create appointments.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['check_availability', 'create_appointment'],
            description: 'The action to perform: check_availability returns available time slots, create_appointment creates a calendar event',
          },
          // check_availability parameters
          calendarId: {
            type: 'string',
            description: 'Calendar ID (default: "primary")',
          },
          date: {
            type: 'string',
            format: 'date',
            description: 'Date in YYYY-MM-DD format (required if start/end not provided)',
          },
          start: {
            type: 'string',
            format: 'date-time',
            description: 'Start date/time in ISO 8601 format with timezone (e.g., 2025-12-16T09:00:00+01:00)',
          },
          end: {
            type: 'string',
            format: 'date-time',
            description: 'End date/time in ISO 8601 format with timezone (e.g., 2025-12-16T17:00:00+01:00)',
          },
          timezone: {
            type: 'string',
            description: 'Timezone (default: "Europe/Zurich")',
          },
          slotMinutes: {
            type: 'number',
            description: 'Slot duration in minutes (default: 30)',
          },
          businessHours: {
            type: 'object',
            properties: {
              from: { type: 'string', description: 'Start time (e.g., "09:00")' },
              to: { type: 'string', description: 'End time (e.g., "17:00")' },
            },
            description: 'Business hours (used when date is provided without start/end)',
          },
          minNoticeMinutes: {
            type: 'number',
            description: 'Minimum notice time in minutes (default: 60)',
          },
          maxResults: {
            type: 'number',
            description: 'Maximum number of slots to return (default: 10)',
          },
          // create_appointment parameters
          summary: {
            type: 'string',
            description: 'Event title/summary (required for create_appointment)',
          },
          description: {
            type: 'string',
            description: 'Event description (optional)',
          },
          attendees: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                email: { type: 'string' },
              },
            },
            description: 'Event attendees (optional)',
          },
          location: {
            type: 'string',
            description: 'Event location (optional)',
          },
        },
        required: ['action'],
      },
    };
  }
}

// Note: calendarTool instance should be created with locationId
// This export is kept for backward compatibility but should be replaced
// with location-specific instances in voice agent context
export function createCalendarTool(locationId: string): CalendarTool {
  return new CalendarTool(locationId);
}


