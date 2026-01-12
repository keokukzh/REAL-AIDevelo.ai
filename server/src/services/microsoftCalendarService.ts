import { Client } from '@microsoft/microsoft-graph-client';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { config } from '../config/env';

interface MicrosoftCalendarEvent {
  subject: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  location?: { displayName: string };
  body?: { contentType: string; content: string };
}

export class MicrosoftCalendarService {
  private msalClient: ConfidentialClientApplication;

  constructor() {
    this.msalClient = new ConfidentialClientApplication({
      auth: {
        clientId: config.microsoftClientId,
        authority: `https://login.microsoftonline.com/${config.microsoftTenantId}`,
        clientSecret: config.microsoftClientSecret,
      },
    });
  }

  // OAuth Flow: Get authorization URL
  async getAuthUrl(userIdOrLocationId: string): Promise<string> {
    const scopes = ['Calendars.ReadWrite', 'offline_access', 'User.Read'];
    return await this.msalClient.getAuthCodeUrl({
      scopes,
      redirectUri: config.microsoftRedirectUri,
      state: userIdOrLocationId, // Pass ID for callback
    });
  }

  // OAuth Flow: Exchange code for tokens
  async getTokensFromCode(code: string): Promise<any> {
    const response = await this.msalClient.acquireTokenByCode({
      code,
      redirectUri: config.microsoftRedirectUri,
      scopes: ['Calendars.ReadWrite', 'offline_access'],
    });

    if (!response) {
      throw new Error('Failed to acquire token from Microsoft');
    }

    return {
      accessToken: response.accessToken,
      refreshToken: (response as any).refreshToken,
      expiresAt: response.expiresOn,
    };
  }

  // Refresh access token
  async refreshAccessToken(refreshToken: string): Promise<any> {
    const response = await this.msalClient.acquireTokenByRefreshToken({
      refreshToken,
      scopes: ['Calendars.ReadWrite', 'offline_access'],
    });

    if (!response) {
      throw new Error('Failed to refresh token from Microsoft');
    }

    return {
      accessToken: response.accessToken,
      expiresAt: response.expiresOn,
    };
  }

  // Create authenticated Graph Client
  private getGraphClient(accessToken: string): Client {
    return Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });
  }

  // List calendar events
  async listEvents(accessToken: string, startDate: Date, endDate: Date): Promise<any[]> {
    const client = this.getGraphClient(accessToken);

    const response = await client
      .api('/me/calendar/calendarView')
      .query({
        startDateTime: startDate.toISOString(),
        endDateTime: endDate.toISOString(),
      })
      .select('subject,start,end,location')
      .orderby('start/dateTime')
      .get();

    return response.value;
  }

  // Create calendar event
  async createEvent(accessToken: string, event: MicrosoftCalendarEvent): Promise<any> {
    const client = this.getGraphClient(accessToken);

    const response = await client.api('/me/calendar/events').post(event);

    return response;
  }

  // Check availability
  async checkAvailability(accessToken: string, startTime: Date, endTime: Date): Promise<boolean> {
    const events = await this.listEvents(accessToken, startTime, endTime);
    return events.length === 0; // Available if no events found
  }
}

export const microsoftCalendarService = new MicrosoftCalendarService();
