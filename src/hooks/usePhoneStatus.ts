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
    } catch (error) {
      logger.error('Failed to fetch phone status', error);
      setPhoneStatus(DEFAULT_ERROR_STATUS);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
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
