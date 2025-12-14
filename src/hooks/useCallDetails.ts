import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import { CallLog } from './useCallLogs';

export interface CallDetailsResponse {
  success: true;
  data: CallLog;
}

export const useCallDetails = (callSid: string | null) => {
  return useQuery<CallLog, Error>({
    queryKey: ['calls', 'details', callSid],
    queryFn: async () => {
      if (!callSid) {
        throw new Error('Call SID is required');
      }
      const response = await apiClient.get<CallDetailsResponse>(`/calls/by-sid/${callSid}`);
      if (!response.data?.success || !response.data.data) {
        throw new Error('Failed to load call details');
      }
      return response.data.data;
    },
    enabled: !!callSid,
    staleTime: 60000, // 1 minute
    retry: 1,
  });
};
