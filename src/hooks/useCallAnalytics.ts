import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import { supabase } from '../lib/supabase';

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
  // Check if session exists before enabling the query
  const [hasSession, setHasSession] = React.useState(false);
  const [isChecking, setIsChecking] = React.useState(true);

  React.useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setHasSession(!!session?.access_token);
      } catch (error) {
        console.error('[useCallsSummary] Error checking session:', error);
        setHasSession(false);
      } finally {
        setIsChecking(false);
      }
    };
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session?.access_token);
    });

    return () => subscription.unsubscribe();
  }, []);

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
    enabled: !isChecking && hasSession, // Only enable when session is confirmed
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch top RAG sources
 */
export function useTopSources(filters: TopSourcesFilters = {}) {
  // Check if session exists before enabling the query
  const [hasSession, setHasSession] = React.useState(false);
  const [isChecking, setIsChecking] = React.useState(true);

  React.useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setHasSession(!!session?.access_token);
      } catch (error) {
        console.error('[useTopSources] Error checking session:', error);
        setHasSession(false);
      } finally {
        setIsChecking(false);
      }
    };
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session?.access_token);
    });

    return () => subscription.unsubscribe();
  }, []);

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
    enabled: !isChecking && hasSession, // Only enable when session is confirmed
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });
}
