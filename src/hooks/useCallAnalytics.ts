import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

export interface CallsSummaryFilters {
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string; // YYYY-MM-DD
  direction?: 'inbound' | 'outbound';
  outcome?: string;
}

export interface CallsSummaryData {
  totals: {
    calls: number;
    completed: number;
    failed: number;
    busy: number;
    noAnswer: number;
    ringing: number;
    queued: number;
  };
  avgDurationSec: number;
  transcriptCoverageRate: number;
  ragUsageRate: number;
  ragAverages: {
    avgQueries: number;
    avgResults: number;
    avgInjectedChars: number;
  };
  elevenCoverageRate: number;
}

export interface TopSourcesFilters {
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

export interface TopSourceItem {
  documentId: string;
  title?: string;
  fileName?: string;
  count: number;
  avgScore: number;
}

export interface TopSourcesData {
  items: TopSourceItem[];
}

/**
 * Hook to fetch call summary statistics
 */
export function useCallsSummary(filters: CallsSummaryFilters = {}) {
  return useQuery({
    queryKey: ['analytics', 'calls', 'summary', filters],
    queryFn: async (): Promise<CallsSummaryData> => {
      const params = new URLSearchParams();
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.direction) params.append('direction', filters.direction);
      if (filters.outcome) params.append('outcome', filters.outcome);

      const response = await apiClient.get(`/analytics/calls/summary?${params.toString()}`);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch call summary');
      }
      return response.data.data;
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch top RAG sources
 */
export function useTopSources(filters: TopSourcesFilters = {}) {
  return useQuery({
    queryKey: ['analytics', 'calls', 'top-sources', filters],
    queryFn: async (): Promise<TopSourcesData> => {
      const params = new URLSearchParams();
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await apiClient.get(`/analytics/calls/top-sources?${params.toString()}`);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch top sources');
      }
      return response.data.data;
    },
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });
}
