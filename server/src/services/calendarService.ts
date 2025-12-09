import { config } from '../config/env';

export interface CalendarAuthResponse {
  authUrl: string;
  state: string;
}

export interface CalendarToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  provider: 'google' | 'outlook';
}

// In-memory storage for OAuth states and tokens (in production, use database)
const oauthStates = new Map<string, { provider: 'google' | 'outlook'; timestamp: number }>();
const calendarTokens = new Map<string, CalendarToken>();

export const calendarService = {
  /**
   * Generate Google Calendar OAuth URL
   */
  getGoogleAuthUrl(redirectUri: string): CalendarAuthResponse {
    const state = `google_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    oauthStates.set(state, { provider: 'google', timestamp: Date.now() });

    const clientId = process.env.GOOGLE_CLIENT_ID || '';
    
    // If OAuth is not configured, return a mock URL for testing
    if (!clientId) {
      console.warn('[CalendarService] GOOGLE_CLIENT_ID not configured, returning mock auth URL');
      return {
        authUrl: `${redirectUri}?code=mock_code&state=${state}`,
        state
      };
    }

    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
    ].join(' ');

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes,
      access_type: 'offline',
      prompt: 'consent',
      state,
    }).toString()}`;

    return { authUrl, state };
  },

  /**
   * Generate Outlook/365 OAuth URL
   */
  getOutlookAuthUrl(redirectUri: string): CalendarAuthResponse {
    const state = `outlook_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    oauthStates.set(state, { provider: 'outlook', timestamp: Date.now() });

    const clientId = process.env.OUTLOOK_CLIENT_ID || '';
    
    // If OAuth is not configured, return a mock URL for testing
    if (!clientId) {
      console.warn('[CalendarService] OUTLOOK_CLIENT_ID not configured, returning mock auth URL');
      return {
        authUrl: `${redirectUri}?code=mock_code&state=${state}`,
        state
      };
    }

    const scopes = [
      'https://graph.microsoft.com/Calendars.ReadWrite',
      'offline_access',
    ].join(' ');

    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes,
      state,
    }).toString()}`;

    return { authUrl, state };
  },

  /**
   * Validate OAuth state
   */
  validateState(state: string): { provider: 'google' | 'outlook' } | null {
    const stateData = oauthStates.get(state);
    if (!stateData) return null;

    // Clean up old states (older than 10 minutes)
    if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
      oauthStates.delete(state);
      return null;
    }

    oauthStates.delete(state); // Use once
    return { provider: stateData.provider };
  },

  /**
   * Exchange authorization code for tokens (Google)
   */
  async exchangeGoogleCode(code: string, redirectUri: string): Promise<CalendarToken> {
    const clientId = process.env.GOOGLE_CLIENT_ID || '';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';

    // In production, make actual API call to Google
    // For now, return mock token
    const mockToken: CalendarToken = {
      accessToken: `google_token_${Date.now()}`,
      refreshToken: `google_refresh_${Date.now()}`,
      expiresAt: Date.now() + 3600 * 1000, // 1 hour
      provider: 'google',
    };

    return mockToken;
  },

  /**
   * Exchange authorization code for tokens (Outlook)
   */
  async exchangeOutlookCode(code: string, redirectUri: string): Promise<CalendarToken> {
    const clientId = process.env.OUTLOOK_CLIENT_ID || '';
    const clientSecret = process.env.OUTLOOK_CLIENT_SECRET || '';

    // In production, make actual API call to Microsoft
    // For now, return mock token
    const mockToken: CalendarToken = {
      accessToken: `outlook_token_${Date.now()}`,
      refreshToken: `outlook_refresh_${Date.now()}`,
      expiresAt: Date.now() + 3600 * 1000, // 1 hour
      provider: 'outlook',
    };

    return mockToken;
  },

  /**
   * Store calendar token
   */
  storeToken(userId: string, token: CalendarToken): void {
    calendarTokens.set(userId, token);
  },

  /**
   * Get calendar token
   */
  getToken(userId: string): CalendarToken | undefined {
    return calendarTokens.get(userId);
  },
};

