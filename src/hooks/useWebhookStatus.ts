import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

export interface WebhookStatusResponse {
  success: true;
  data: {
    configured: {
      voiceUrl: string | null;
      statusCallbackUrl: string | null;
    };
    expected: {
      voiceUrl: string;
      statusCallbackUrl: string;
    };
    matches: {
      voiceUrl: boolean;
      statusCallbackUrl: boolean;
    };
    phoneNumber: {
      sid: string;
      number: string;
    } | null;
  };
}

export const useWebhookStatus = () => {
  return useQuery<WebhookStatusResponse['data'], Error>({
    queryKey: ['phone', 'webhook-status'],
    queryFn: async () => {
      const response = await apiClient.get<WebhookStatusResponse>('/phone/webhook-status');
      if (!response.data?.success || !response.data.data) {
        throw new Error('Failed to load webhook status');
      }
      return response.data.data;
    },
    staleTime: 30000, // 30 seconds
    retry: 1,
  });
};
