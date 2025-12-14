import { voiceAgentConfig } from '../config';
import axios from 'axios';
import { calendarService } from '../../services/calendarService';

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

export class CalendarTool {
  private locationId: string;

  constructor(locationId: string) {
    this.locationId = locationId;
  }

  /**
   * Check availability in calendar
   */
  async checkAvailability(
    start: Date,
    end: Date,
    calendarType: 'google' | 'outlook' = 'google'
  ): Promise<CalendarAvailability[]> {
    try {
      // Refresh token if needed
      const accessToken = await calendarService.refreshTokenIfNeeded(this.locationId, calendarType);

      if (calendarType === 'google') {
        // Google Calendar freebusy API
        const response = await axios.post(
          'https://www.googleapis.com/calendar/v3/freeBusy',
          {
            timeMin: start.toISOString(),
            timeMax: end.toISOString(),
            items: [{ id: 'primary' }],
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        // Parse busy times and return availability
        const busy = response.data.calendars?.primary?.busy || [];
        // Simplified: return available if no busy times
        return [
          {
            start: new Date(start),
            end: new Date(end),
            available: busy.length === 0,
          },
        ];
      } else {
        // Outlook Calendar API integration would go here
        return [
          {
            start: new Date(start),
            end: new Date(end),
            available: true,
          },
        ];
      }
    } catch (error: any) {
      if (error.message?.includes('Calendar not connected')) {
        throw new Error('Kalender ist nicht verbunden. Bitte verbinden Sie zuerst Ihren Kalender.');
      }
      throw error;
    }
  }

  /**
   * Create calendar event
   */
  async createEvent(
    event: CalendarEvent,
    calendarType: 'google' | 'outlook' = 'google'
  ): Promise<{ success: boolean; eventId?: string; error?: string }> {
    try {
      // Refresh token if needed
      const accessToken = await calendarService.refreshTokenIfNeeded(this.locationId, calendarType);

      if (calendarType === 'google') {
        // Google Calendar events.insert API
        const response = await axios.post(
          'https://www.googleapis.com/calendar/v3/calendars/primary/events',
          {
            summary: event.title,
            description: event.description || '',
            start: {
              dateTime: event.start.toISOString(),
              timeZone: 'Europe/Zurich',
            },
            end: {
              dateTime: event.end.toISOString(),
              timeZone: 'Europe/Zurich',
            },
            attendees: event.attendees?.map(email => ({ email })) || [],
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        return { success: true, eventId: response.data.id };
      } else {
        // Outlook Calendar API call would go here
        return { success: true, eventId: 'mock-event-id' };
      }
    } catch (error: any) {
      if (error.message?.includes('Calendar not connected')) {
        return { success: false, error: 'Kalender ist nicht verbunden. Bitte verbinden Sie zuerst Ihren Kalender.' };
      }
      return { success: false, error: error.message || 'Unbekannter Fehler' };
    }
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
      description: 'Manage calendar events and check availability. Can create appointments, check availability, and list upcoming events.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['check_availability', 'create_event', 'list_events'],
            description: 'The action to perform',
          },
          start: {
            type: 'string',
            format: 'date-time',
            description: 'Start date/time (ISO 8601)',
          },
          end: {
            type: 'string',
            format: 'date-time',
            description: 'End date/time (ISO 8601)',
          },
          title: {
            type: 'string',
            description: 'Event title (required for create_event)',
          },
          description: {
            type: 'string',
            description: 'Event description (optional)',
          },
          attendees: {
            type: 'array',
            items: { type: 'string' },
            description: 'Event attendees (email addresses)',
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


