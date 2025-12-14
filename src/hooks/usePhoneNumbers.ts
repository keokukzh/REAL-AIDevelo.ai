import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

export interface PhoneNumber {
  id: string;
  providerSid: string;
  number: string;
  country: string;
  status: 'available' | 'unavailable';
  capabilities: {
    voice: boolean;
    sms: boolean;
  };
  metadata?: {
    friendlyName?: string;
  };
}

export interface PhoneNumbersResponse {
  success: boolean;
  data: PhoneNumber[];
}

export const usePhoneNumbers = (country: string = 'CH') => {
  return useQuery<PhoneNumber[], Error>({
    queryKey: ['phone', 'numbers', country],
    queryFn: async () => {
      const response = await apiClient.get<PhoneNumbersResponse>(
        `/phone/numbers?country=${country}`
      );
      if (!response.data?.success || !response.data.data) {
        throw new Error('Failed to load phone numbers');
      }
      return response.data.data;
    },
    staleTime: 60000, // 1 minute
    retry: 1,
  });
};
