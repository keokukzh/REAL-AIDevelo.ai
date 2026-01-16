import { AxiosError, AxiosRequestConfig } from 'axios';
import { apiClient } from './apiClient.js';

export interface ApiError {
  success: false;
  error: string;
  details?: unknown;
}

export class ApiRequestError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export async function apiRequest<T>(endpoint: string, config: AxiosRequestConfig = {}): Promise<T> {
  try {
    const response = await apiClient.request<T>({
      url: endpoint,
      ...config,
    });

    return response.data;
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }

    if (error instanceof AxiosError) {
      const statusCode = error.response?.status ?? 0;
      const payload = error.response?.data as ApiError | undefined;

      throw new ApiRequestError(
        statusCode,
        payload?.error || error.message || 'API Error',
        payload?.details,
      );
    }

    throw new ApiRequestError(0, 'Unknown API error', error);
  }
}

// Phone status check
export async function checkPhoneStatus(): Promise<{
  twilioGateway: 'OK' | 'WARN' | 'ERROR';
  twilioConfigured: boolean;
  hasConnectedNumber: boolean;
  webhookConfigured: boolean;
  phoneNumber: string | null;
  details: {
    accountSid: string | null;
    publicBaseUrl: string | null;
    expectedWebhookUrl: string | null;
  };
}> {
  const response = await apiClient.get('/phone/status');
  return response.data.data;
}

// Make a test call
export async function makeTestCall(from: string, to: string) {
  const response = await apiClient.post('/calls/test', { from, to });
  return response.data;
}
