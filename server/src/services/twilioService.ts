import axios from 'axios';
import { config } from '../config/env';
import { InternalServerError } from '../utils/errors';
import { StructuredLoggingService } from './loggingService';

interface TwilioPhoneNumber {
  sid: string;
  phoneNumber: string;
  friendlyName: string;
  capabilities: {
    voice: boolean;
    sms: boolean;
  };
  status: string;
}

interface TwilioCallResponse {
  sid: string;
  status: string;
  from: string;
  to: string;
}

/**
 * Twilio Service
 * Handles all Twilio API interactions including phone numbers, webhooks, and calls
 * Uses circuit breakers and retry logic for resilience
 */
class TwilioService {
  /**
   * Get Twilio Account SID from environment
   * @returns Account SID or empty string if not configured
   */
  private getAccountSid(): string {
    return process.env.TWILIO_ACCOUNT_SID || '';
  }

  /**
   * Get Twilio Auth Token from config
   * @returns Auth token
   */
  private getAuthToken(): string {
    return config.twilioAuthToken;
  }

  /**
   * Get Twilio API base URL
   * @returns Base URL for Twilio API
   * @throws {InternalServerError} If Account SID not configured
   */
  private getBaseUrl(): string {
    const accountSid = this.getAccountSid();
    if (!accountSid) {
      throw new InternalServerError('TWILIO_ACCOUNT_SID not configured');
    }
    return `https://api.twilio.com/2010-04-01/Accounts/${accountSid}`;
  }

  /**
   * Get HTTP Basic Auth credentials for Twilio API
   * @returns Object with username (Account SID) and password (Auth Token)
   */
  private getAuth(): { username: string; password: string } {
    return {
      username: this.getAccountSid(),
      password: this.getAuthToken(),
    };
  }

  /**
   * List available phone numbers from Twilio
   * 
   * Retrieves phone numbers available in the Twilio account, optionally filtered by country.
   * Uses circuit breaker and retry logic for resilience.
   * 
   * @param country - Country code to filter by (default: 'CH' for Switzerland)
   * @returns Promise resolving to array of Twilio phone numbers
   * @throws {InternalServerError} If API call fails or credentials invalid
   * 
   * @example
   * ```typescript
   * const numbers = await twilioService.listPhoneNumbers('CH');
   * // Returns: [{ sid: '...', phoneNumber: '+41...', ... }, ...]
   * ```
   */
  async listPhoneNumbers(country: string = 'CH'): Promise<TwilioPhoneNumber[]> {
    const accountSid = this.getAccountSid();
    const authToken = this.getAuthToken();

    if (!accountSid || !authToken) {
      // Return mock data for testing
      StructuredLoggingService.warn(
        'TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN not configured, returning mock data',
        { country }
      );
      return [
        {
          sid: 'mock_1',
          phoneNumber: '+41441234567',
          friendlyName: 'Mock Number 1',
          capabilities: { voice: true, sms: false },
          status: 'in-use',
        },
        {
          sid: 'mock_2',
          phoneNumber: '+41441234568',
          friendlyName: 'Mock Number 2',
          capabilities: { voice: true, sms: true },
          status: 'in-use',
        },
      ];
    }

    try {
      const baseUrl = this.getBaseUrl();
      const response = await circuitBreakers.twilio.execute(
        () => retryApiCall(
          () => axios.get(`${baseUrl}/IncomingPhoneNumbers.json`, {
            auth: this.getAuth(),
            params: {
              PhoneNumber: country === 'CH' ? '+41' : undefined,
            },
            timeout: API_TIMEOUTS.TWILIO,
          })
        )
      );

      return (response.data.incoming_phone_numbers || []).map((num: any) => ({
        sid: num.sid,
        phoneNumber: num.phone_number,
        friendlyName: num.friendly_name || num.phone_number,
        capabilities: {
          voice: num.capabilities?.voice === true,
          sms: num.capabilities?.sms === true,
        },
        status: num.status || 'in-use',
      }));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data
          ? JSON.stringify(error.response.data)
          : error.message;
        throw new InternalServerError(`Failed to fetch Twilio phone numbers: ${errorMessage}`);
      }
      throw new InternalServerError('Failed to fetch phone numbers from Twilio');
    }
  }

  /**
   * Get webhook configuration for a phone number
   */
  async getWebhookStatus(phoneNumberSid: string): Promise<{
    voiceUrl: string | null;
    statusCallback: string | null;
  }> {
    const accountSid = this.getAccountSid();
    const authToken = this.getAuthToken();

    if (!accountSid || !authToken) {
      return {
        voiceUrl: null,
        statusCallback: null,
      };
    }

    try {
      const baseUrl = this.getBaseUrl();
      const response = await axios.get(`${baseUrl}/IncomingPhoneNumbers/${phoneNumberSid}.json`, {
        auth: this.getAuth(),
        timeout: 10000,
      });

      const number = response.data;
      return {
        voiceUrl: number.voice_url || null,
        statusCallback: number.status_callback || null,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data
          ? JSON.stringify(error.response.data)
          : error.message;
        throw new InternalServerError(`Failed to fetch webhook status: ${errorMessage}`);
      }
      throw new InternalServerError('Failed to fetch webhook status from Twilio');
    }
  }

  /**
   * Update webhook URLs for a phone number
   */
  async updateWebhooks(phoneNumberSid: string, voiceUrl: string, statusCallback: string): Promise<void> {
    const accountSid = this.getAccountSid();
    const authToken = this.getAuthToken();

    if (!accountSid || !authToken) {
      throw new InternalServerError('TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN not configured');
    }

    try {
      const baseUrl = this.getBaseUrl();
      await circuitBreakers.twilio.execute(
        () => retryApiCall(
          () => axios.post(
            `${baseUrl}/IncomingPhoneNumbers/${phoneNumberSid}.json`,
            new URLSearchParams({
              VoiceUrl: voiceUrl,
              StatusCallback: statusCallback,
            }),
            {
              auth: this.getAuth(),
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              timeout: API_TIMEOUTS.TWILIO,
            }
          )
        )
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data
          ? JSON.stringify(error.response.data)
          : error.message;
        throw new InternalServerError(`Failed to update webhooks: ${errorMessage}`);
      }
      throw new InternalServerError('Failed to update webhooks in Twilio');
    }
  }

  /**
   * Make a test call using Twilio API
   */
  async makeCall(from: string, to: string, url: string): Promise<TwilioCallResponse> {
    const accountSid = this.getAccountSid();
    const authToken = this.getAuthToken();

    if (!accountSid || !authToken) {
      throw new InternalServerError('TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN not configured');
    }

    try {
      const baseUrl = this.getBaseUrl();
      const response = await axios.post(
        `${baseUrl}/Calls.json`,
        new URLSearchParams({
          From: from,
          To: to,
          Url: url,
        }),
        {
          auth: this.getAuth(),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 10000,
        }
      );

      return {
        sid: response.data.sid,
        status: response.data.status,
        from: response.data.from,
        to: response.data.to,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data
          ? JSON.stringify(error.response.data)
          : error.message;
        throw new InternalServerError(`Failed to make call: ${errorMessage}`);
      }
      throw new InternalServerError('Failed to make call via Twilio');
    }
  }
}

export const twilioService = new TwilioService();
