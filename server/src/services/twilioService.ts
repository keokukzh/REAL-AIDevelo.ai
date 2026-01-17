import axios from 'axios';
import twilio from 'twilio';
import { config } from '../config/env';
import { InternalServerError } from '../utils/errors';
import { StructuredLoggingService } from './loggingService';
import { circuitBreakers } from '../utils/circuitBreaker';
import { retryApiCall } from '../utils/retry';
import { API_TIMEOUTS } from '../config/constants';
import { supabaseAdmin } from './supabaseDb';

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
 */
class TwilioService {
  private client: twilio.Twilio | null = null;

  constructor() {
    this.initClient();
  }

  private initClient() {
    const accountSid = this.getAccountSid();
    const authToken = this.getAuthToken();
    const apiKeySid = config.twilioApiKeySid;
    const apiKeySecret = config.twilioApiKeySecret;

    if (accountSid && apiKeySid && apiKeySecret) {
      this.client = twilio(apiKeySid, apiKeySecret, { accountSid });
      StructuredLoggingService.info('Twilio Client initialized with API Key');
    } else if (accountSid && authToken) {
      this.client = twilio(accountSid, authToken);
      StructuredLoggingService.info('Twilio Client initialized with Auth Token');
    }
  }

  private getAccountSid(): string {
    return process.env.TWILIO_ACCOUNT_SID || '';
  }

  private getAuthToken(): string {
    return config.twilioAuthToken || '';
  }

  private getBaseUrl(): string {
    const accountSid = this.getAccountSid();
    if (!accountSid) {
      throw new InternalServerError('TWILIO_ACCOUNT_SID not configured');
    }
    return `https://api.twilio.com/2010-04-01/Accounts/${accountSid}`;
  }

  private getAuth(): { username: string; password: string } {
    if (config.twilioApiKeySid && config.twilioApiKeySecret) {
      return {
        username: config.twilioApiKeySid,
        password: config.twilioApiKeySecret,
      };
    }
    return {
      username: this.getAccountSid(),
      password: this.getAuthToken(),
    };
  }

  /**
   * Test Twilio connection
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.client) this.initClient();
      if (!this.client) return false;

      const account = await this.client.api.accounts(this.getAccountSid()).fetch();
      return account.status === 'active';
    } catch (error: any) {
      StructuredLoggingService.error('Twilio connection test failed', error);
      return false;
    }
  }

  /**
   * List available phone numbers from Twilio
   */
  async listPhoneNumbers(country: string = 'CH'): Promise<TwilioPhoneNumber[]> {
    const accountSid = this.getAccountSid();
    const authToken = this.getAuthToken();

    if (!accountSid || !authToken) {
      StructuredLoggingService.warn('Twilio not configured, returning mock data');
      return [
        {
          sid: 'mock_1',
          phoneNumber: '+19522951346',
          friendlyName: 'Default Test Number (+19522951346)',
          capabilities: { voice: true, sms: true },
          status: 'in-use',
        },
      ];
    }

    try {
      const baseUrl = this.getBaseUrl();
      const response = await circuitBreakers.twilio.execute(() =>
        retryApiCall(() =>
          axios.get(`${baseUrl}/IncomingPhoneNumbers.json`, {
            auth: this.getAuth(),
            timeout: API_TIMEOUTS.TWILIO,
          }),
        ),
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
      throw new InternalServerError('Failed to fetch phone numbers from Twilio');
    }
  }

  /**
   * List available phone numbers for purchase
   */
  async listAvailableNumbers(country: string = 'CH', areaCode?: string): Promise<any[]> {
    if (!this.client) this.initClient();
    if (!this.client) throw new InternalServerError('Twilio client not initialized');

    try {
      const numbers = await this.client.availablePhoneNumbers(country).local.list({
        areaCode: areaCode ? parseInt(areaCode, 10) : undefined,
        limit: 10,
      });
      return numbers;
    } catch (error: any) {
      StructuredLoggingService.error('Failed to list available numbers', error);
      throw new InternalServerError(`Twilio Error: ${error.message}`);
    }
  }

  /**
   * Purchase a phone number
   */
  async purchaseNumber(phoneNumber: string): Promise<any> {
    if (!this.client) this.initClient();
    if (!this.client) throw new InternalServerError('Twilio client not initialized');

    try {
      const purchasedNumber = await this.client.incomingPhoneNumbers.create({
        phoneNumber: phoneNumber,
      });
      return purchasedNumber;
    } catch (error: any) {
      StructuredLoggingService.error('Failed to purchase number', error);
      throw new InternalServerError(`Twilio Error: ${error.message}`);
    }
  }

  /**
   * Add phone number to database and status active
   */
  async addPhoneNumber(
    locationId: string,
    phoneNumber: string,
    userId: string,
    twilioSid?: string,
  ): Promise<void> {
    const { error } = await supabaseAdmin.from('phone_numbers').upsert(
      {
        location_id: locationId,
        e164: phoneNumber,
        status: 'active',
        twilio_number_sid: twilioSid || `manual_${Date.now()}`,
        customer_public_number: phoneNumber,
      },
      { onConflict: 'e164' },
    );

    if (error) {
      StructuredLoggingService.error('Failed to add phone number to Supabase', error);
      throw new InternalServerError('Failed to register phone number');
    }

    StructuredLoggingService.info('Phone number registered successfully', {
      phoneNumber,
      locationId,
    });
  }

  /**
   * Get webhook configuration for a phone number
   */
  async getWebhookStatus(phoneNumberSid: string): Promise<{
    voiceUrl: string | null;
    statusCallback: string | null;
  }> {
    if (!this.client) this.initClient();
    if (!this.client) return { voiceUrl: null, statusCallback: null };

    try {
      const number = await this.client.incomingPhoneNumbers(phoneNumberSid).fetch();
      return {
        voiceUrl: number.voiceUrl || null,
        statusCallback: number.statusCallback || null,
      };
    } catch (error) {
      throw new InternalServerError('Failed to fetch webhook status from Twilio');
    }
  }

  /**
   * Update webhook URLs for a phone number
   */
  async updateWebhooks(
    phoneNumberSid: string,
    voiceUrl: string,
    statusCallback: string,
  ): Promise<void> {
    if (!this.client) this.initClient();
    if (!this.client) throw new InternalServerError('Twilio client not initialized');

    try {
      await this.client.incomingPhoneNumbers(phoneNumberSid).update({
        voiceUrl,
        statusCallback,
        voiceMethod: 'POST',
        statusCallbackMethod: 'POST',
      });
      StructuredLoggingService.info('Twilio webhooks updated', { phoneNumberSid, voiceUrl });
    } catch (error) {
      throw new InternalServerError('Failed to update webhooks in Twilio');
    }
  }

  /**
   * Make a call using Twilio API
   */
  async makeCall(from: string, to: string, url: string): Promise<TwilioCallResponse> {
    if (!this.client) this.initClient();
    if (!this.client) throw new InternalServerError('Twilio client not initialized');

    try {
      const call = await this.client.calls.create({ from, to, url });
      return {
        sid: call.sid,
        status: call.status,
        from: call.from,
        to: call.to,
      };
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      throw new InternalServerError(`Failed to make call via Twilio: ${errorMsg}`);
    }
  }
}

export const twilioService = new TwilioService();
