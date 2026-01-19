import { useState, useEffect, useCallback } from 'react';
import { checkPhoneStatus } from '../services/api.js';
import { logger } from '../lib/logger.js';

export interface PhoneStatus {
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
}

const DEFAULT_ERROR_STATUS: PhoneStatus = {
  twilioGateway: 'ERROR',
  twilioConfigured: false,
  hasConnectedNumber: false,
  webhookConfigured: false,
  phoneNumber: null,
  details: {
    accountSid: null,
    publicBaseUrl: null,
    expectedWebhookUrl: null,
  },
};

/**
 * Custom hook for phone status polling
 * Fetches phone status every 30 seconds
 */
export const usePhoneStatus = () => {
  const [phoneStatus, setPhoneStatus] = useState<PhoneStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const status = await checkPhoneStatus();
      setPhoneStatus(status);
      setIsLoading(false);
    } catch (error: unknown) {
      // Don't log 503 errors as errors - they're temporary service unavailability
      const status = (error as any)?.response?.status || (error as any)?.status;
      if (status === 503) {
        // Service temporarily unavailable - use default error status but don't log as error
        logger.warn('Phone status service temporarily unavailable (503)', { retryable: true });
        setPhoneStatus(DEFAULT_ERROR_STATUS);
      } else {
        logger.error('Failed to fetch phone status', error);
        setPhoneStatus(DEFAULT_ERROR_STATUS);
      }
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    // Use longer interval for 503 errors to avoid hammering the server
    const interval = setInterval(fetchStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const refreshStatus = useCallback(async () => {
    await fetchStatus();
  }, [fetchStatus]);

  return {
    phoneStatus,
    isLoading,
    refreshStatus,
  };
};
