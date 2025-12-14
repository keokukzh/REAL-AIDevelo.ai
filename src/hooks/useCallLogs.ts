import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

export interface CallLog {
  id: string;
  callSid: string;
  direction: string;
  from_e164: string | null;
  to_e164: string | null;
  started_at: string;
  ended_at: string | null;
  duration_sec: number | null;
  outcome: string | null;
  notes: any;
}

export interface CallLogsResponse {
  success: true;
  data: {
    items: CallLog[];
    total: number;
    limit: number;
    offset: number;
  };
}

export interface CallLogsParams {
  limit?: number;
  offset?: number;
  direction?: 'inbound' | 'outbound';
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export const useCallLogs = (params: CallLogsParams = {}) => {
  return useQuery<CallLogsResponse['data'], Error>({
    queryKey: ['calls', 'list', params],
    queryFn: async () => {
      const response = await apiClient.get<CallLogsResponse>('/calls', {
        params: {
          limit: params.limit || 20,
          offset: params.offset || 0,
          ...(params.direction && { direction: params.direction }),
          ...(params.status && { status: params.status }),
          ...(params.dateFrom && { dateFrom: params.dateFrom }),
          ...(params.dateTo && { dateTo: params.dateTo }),
          ...(params.search && { search: params.search }),
        },
      });
      if (!response.data?.success || !response.data.data) {
        throw new Error('Failed to load calls');
      }
      return response.data.data;
    },
    staleTime: 30000, // 30 seconds
    retry: 1,
  });
};
