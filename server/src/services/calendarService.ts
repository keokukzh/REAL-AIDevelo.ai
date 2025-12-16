import axios from 'axios';
import { config } from '../config/env';
import { supabaseAdmin } from './supabaseDb';
import { encrypt, decrypt } from '../utils/tokenEncryption';
import { logger, serializeError, redact } from '../utils/logger';

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

interface TokenRow {
  id: string;
  location_id: string;
  provider: string;
  access_token: string | null;
  refresh_token_encrypted: string | null;
  expiry_ts: string | null;
  connected_email: string | null;
}

// In-memory fallback storage (only used if TOKEN_ENCRYPTION_KEY missing or DB unreachable)
const calendarTokensFallback = new Map<string, CalendarToken>();
let fallbackMode = false;

export const calendarService = {
  /**
   * Generate Google Calendar OAuth URL
   */
  getGoogleAuthUrl(redirectUri: string, locationId: string): CalendarAuthResponse {
    // Note: State will be created in routes using createSignedState()
    // This method is kept for backward compatibility but locationId is required
    const { createSignedState } = require('../utils/oauthState');
    const state = createSignedState({ locationId, provider: 'google' });

    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CALENDAR_CLIENT_ID || '';
    
    // If OAuth is not configured, return a mock URL for testing
    if (!clientId) {
      console.warn('[CalendarService] GOOGLE_OAUTH_CLIENT_ID not configured, returning mock auth URL');
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
  getOutlookAuthUrl(redirectUri: string, locationId: string): CalendarAuthResponse {
    // Note: State will be created in routes using createSignedState()
    // This method is kept for backward compatibility but locationId is required
    const { createSignedState } = require('../utils/oauthState');
    const state = createSignedState({ locationId, provider: 'outlook' });

    const clientId = process.env.OUTLOOK_CLIENT_ID || '';
    
    // If OAuth is not configured, return a mock URL for testing
    if (!clientId) {
      logger.warn('calendar.oauth.outlook_not_configured', redact({
        locationId,
      }));
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
   * Exchange authorization code for tokens (Google)
   */
  async exchangeGoogleCode(code: string, redirectUri: string): Promise<CalendarToken> {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CALENDAR_CLIENT_ID || '';
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CALENDAR_CLIENT_SECRET || '';

    if (!clientId || !clientSecret) {
      throw new Error('GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET must be set');
    }

    // Make actual API call to Google to exchange code for tokens
    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      // Check if refresh_token is present (required for offline access)
      if (!response.data.refresh_token) {
        console.error('[CalendarService] Google OAuth response missing refresh_token:', {
          hasAccessToken: !!response.data.access_token,
          hasRefreshToken: !!response.data.refresh_token,
          expiresIn: response.data.expires_in,
          scope: response.data.scope,
        });
        throw new Error('Google OAuth hat keinen Refresh Token zurückgegeben. Stelle sicher, dass access_type=offline und prompt=consent in der OAuth-URL gesetzt sind.');
      }

      const token: CalendarToken = {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresAt: Date.now() + (response.data.expires_in * 1000),
        provider: 'google',
      };

      return token;
    } catch (error: any) {
      console.error('[CalendarService] Error exchanging Google code:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
      });
      
      // Extract detailed error message from Google API
      let errorMessage = 'Fehler beim Austausch des OAuth-Codes';
      if (error.response?.data) {
        const googleError = error.response.data;
        if (googleError.error_description) {
          errorMessage = `Google OAuth Fehler: ${googleError.error_description}`;
        } else if (googleError.error) {
          errorMessage = `Google OAuth Fehler: ${googleError.error}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
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
   * Store calendar token in database
   * Encrypts refresh_token and stores in google_calendar_integrations table
   */
  async storeToken(locationId: string, token: CalendarToken): Promise<void> {
    if (fallbackMode) {
      logger.warn('calendar.token.fallback_mode', redact({
        locationId,
        provider: token.provider,
      }));
      calendarTokensFallback.set(locationId, token);
      return;
    }

    try {
      if (!token.refreshToken) {
        throw new Error('refreshToken is required for storage');
      }

      const encryptedRefreshToken = encrypt(token.refreshToken);
      const expiryTs = new Date(token.expiresAt).toISOString();

      const { error } = await supabaseAdmin
        .from('google_calendar_integrations')
        .upsert(
          {
            location_id: locationId,
            provider: token.provider,
            access_token: token.accessToken,
            refresh_token_encrypted: encryptedRefreshToken,
            expiry_ts: expiryTs,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'location_id,provider',
          }
        );

      if (error) {
        throw error;
      }

      logger.info('calendar.token.stored', redact({
        locationId,
        provider: token.provider,
        expiryTs,
      }));
    } catch (error) {
      // In production, never use fallback - fail hard
      if (process.env.NODE_ENV === 'production') {
        const isEncryptionKeyError = error instanceof Error && 
          (error.message.includes('TOKEN_ENCRYPTION_KEY') || 
           !process.env.TOKEN_ENCRYPTION_KEY || 
           process.env.TOKEN_ENCRYPTION_KEY === '');
        
        if (isEncryptionKeyError) {
          logger.error('calendar.token.store_fatal', null, redact({
            locationId,
            provider: token.provider,
            reason: 'TOKEN_ENCRYPTION_KEY missing in production',
          }));
          throw new Error(
            'TOKEN_ENCRYPTION_KEY fehlt in Render. ' +
            'Bitte setze diese Environment Variable in Render: ' +
            '1. Render Dashboard → REAL-AIDevelo.ai → Environment → Add Variable, ' +
            '2. KEY: TOKEN_ENCRYPTION_KEY, ' +
            '3. VALUE: (generiere mit: openssl rand -base64 32), ' +
            '4. Save Changes. ' +
            'Ohne diesen Key können Kalender-Tokens nicht verschlüsselt gespeichert werden.'
          );
        }
      }
      
      // In development, fall back to in-memory only if encryption key missing
      if (!process.env.TOKEN_ENCRYPTION_KEY || (error instanceof Error && error.message.includes('TOKEN_ENCRYPTION_KEY'))) {
        logger.warn('calendar.token.fallback_dev', redact({
          locationId,
          provider: token.provider,
        }));
        fallbackMode = true;
        calendarTokensFallback.set(locationId, token);
      } else {
        // Re-throw the original error if it's not about encryption key
        logger.error('calendar.token.store_failed', error, redact({
          locationId,
          provider: token.provider,
        }));
        throw error;
      }
    }
  },

  /**
   * Get token row from database
   */
  async getTokenRow(locationId: string, provider: 'google' | 'outlook' = 'google'): Promise<TokenRow | null> {
    if (fallbackMode) {
      const token = calendarTokensFallback.get(locationId);
      if (!token || token.provider !== provider) {
        return null;
      }
      // Return mock row structure for fallback
      return {
        id: 'fallback',
        location_id: locationId,
        provider,
        access_token: token.accessToken,
        refresh_token_encrypted: token.refreshToken || null,
        expiry_ts: new Date(token.expiresAt).toISOString(),
        connected_email: null,
      };
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('google_calendar_integrations')
        .select('id, location_id, provider, access_token, refresh_token_encrypted, expiry_ts, connected_email')
        .eq('location_id', locationId)
        .eq('provider', provider)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('calendar.token.get_failed', error, redact({
        locationId,
        provider,
      }));
      throw error;
    }
  },

  /**
   * Refresh access token if needed (expires within 5 minutes)
   * Returns refreshed token or throws if not connected
   */
  async refreshTokenIfNeeded(locationId: string, provider: 'google' | 'outlook' = 'google'): Promise<string> {
    const row = await this.getTokenRow(locationId, provider);

    if (!row || !row.access_token) {
      throw new Error(`Calendar not connected for locationId=${locationId}, provider=${provider}`);
    }

    if (!row.refresh_token_encrypted) {
      throw new Error(`Refresh token missing for locationId=${locationId}, provider=${provider}`);
    }

    const expiryTs = row.expiry_ts ? new Date(row.expiry_ts).getTime() : 0;
    const now = Date.now();
    const fiveMinutesMs = 5 * 60 * 1000;

    // Check if token expires within 5 minutes
    if (expiryTs > now + fiveMinutesMs) {
      console.log(`[CalendarService] Token still valid for locationId=${locationId}, provider=${provider}, expires in ${Math.round((expiryTs - now) / 1000)}s`);
      return row.access_token;
    }

    // Token expired or expires soon, refresh it
    console.log(`[CalendarService] Refreshing token for locationId=${locationId}, provider=${provider}`);

    if (provider === 'google') {
      return await this.refreshGoogleToken(locationId, row.refresh_token_encrypted);
    } else {
      throw new Error(`Token refresh not implemented for provider: ${provider}`);
    }
  },

  /**
   * Refresh Google access token using refresh_token
   */
  async refreshGoogleToken(locationId: string, encryptedRefreshToken: string): Promise<string> {
    let refreshToken: string;
    
    try {
      refreshToken = decrypt(encryptedRefreshToken);
    } catch (error) {
      throw new Error(`Failed to decrypt refresh token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CALENDAR_CLIENT_ID || '';
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CALENDAR_CLIENT_SECRET || '';

    if (!clientId || !clientSecret) {
      throw new Error('GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET must be set');
    }

    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const newAccessToken = response.data.access_token;
      const expiresIn = response.data.expires_in || 3600; // Default 1 hour
      const newExpiresAt = Date.now() + (expiresIn * 1000);
      const newExpiryTs = new Date(newExpiresAt).toISOString();

      // Update database with new access token
      const { error } = await supabaseAdmin
        .from('google_calendar_integrations')
        .update({
          access_token: newAccessToken,
          expiry_ts: newExpiryTs,
          updated_at: new Date().toISOString(),
        })
        .eq('location_id', locationId)
        .eq('provider', 'google');

      if (error) {
        logger.error('calendar.token.refresh_update_failed', error, redact({
          locationId,
          provider: 'google',
        }));
        // Still return the new token even if DB update fails
      }

      logger.info('calendar.token.refreshed', redact({
        locationId,
        provider: 'google',
        newExpiryTs,
      }));
      return newAccessToken;
    } catch (error: any) {
      logger.error('calendar.token.refresh_failed', error, redact({
        locationId,
        provider: 'google',
      }));
      throw new Error(`Failed to refresh Google token: ${error.response?.data?.error_description || error.message}`);
    }
  },

  /**
   * Get calendar token (legacy method, kept for backward compatibility)
   * @deprecated Use getTokenRow() instead
   */
  async getToken(locationId: string): Promise<CalendarToken | undefined> {
    const row = await this.getTokenRow(locationId);
    if (!row || !row.access_token) {
      return undefined;
    }

    let refreshToken: string | undefined;
    if (row.refresh_token_encrypted) {
      try {
        refreshToken = decrypt(row.refresh_token_encrypted);
      } catch (error) {
        logger.error('calendar.token.decrypt_failed', error, redact({
          locationId,
        }));
      }
    }

    return {
      accessToken: row.access_token,
      refreshToken,
      expiresAt: row.expiry_ts ? new Date(row.expiry_ts).getTime() : 0,
      provider: row.provider as 'google' | 'outlook',
    };
  },
};

