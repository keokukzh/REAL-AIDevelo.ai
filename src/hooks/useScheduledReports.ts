import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import { supabase } from '../lib/supabase';

export interface ScheduledReport {
  id: string;
  location_id: string;
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  timezone: string;
  recipients: string[];
  filters: {
    dateRangePreset?: string;
    direction?: 'inbound' | 'outbound';
    outcome?: string;
    limitSources?: number;
  };
  last_run_at: string | null;
  next_run_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateScheduledReportInput {
  frequency: 'daily' | 'weekly' | 'monthly';
  timezone?: string;
  recipients: string[];
  filters?: {
    dateRangePreset?: string;
    direction?: 'inbound' | 'outbound';
    outcome?: string;
    limitSources?: number;
  };
  enabled?: boolean;
}

export interface UpdateScheduledReportInput {
  enabled?: boolean;
  frequency?: 'daily' | 'weekly' | 'monthly';
  timezone?: string;
  recipients?: string[];
  filters?: {
    dateRangePreset?: string;
    direction?: 'inbound' | 'outbound';
    outcome?: string;
    limitSources?: number;
  };
}

/**
 * Hook to list scheduled reports for current location
 */
export function useScheduledReports() {
  // Check if session exists before enabling the query
  const [hasSession, setHasSession] = React.useState(false);
  const [isChecking, setIsChecking] = React.useState(true);

  React.useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setHasSession(!!session?.access_token);
      } catch (error) {
        console.error('[useScheduledReports] Error checking session:', error);
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
    queryKey: ['scheduledReports'],
    queryFn: async (): Promise<ScheduledReport[]> => {
      const response = await apiClient.get('/reports/scheduled');
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch scheduled reports');
      }
      return response.data.data;
    },
    enabled: !isChecking && hasSession, // Only enable when session is confirmed
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to create a scheduled report
 */
export function useCreateScheduledReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateScheduledReportInput): Promise<ScheduledReport> => {
      const response = await apiClient.post('/reports/scheduled', input);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to create scheduled report');
      }
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledReports'] });
    },
  });
}

/**
 * Hook to update a scheduled report
 */
export function useUpdateScheduledReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateScheduledReportInput }): Promise<ScheduledReport> => {
      const response = await apiClient.patch(`/reports/scheduled/${id}`, input);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to update scheduled report');
      }
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledReports'] });
    },
  });
}

/**
 * Hook to delete a scheduled report
 */
export function useDeleteScheduledReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await apiClient.delete(`/reports/scheduled/${id}`);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to delete scheduled report');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledReports'] });
    },
  });
}

/**
 * Hook to send a test report immediately
 */
export function useTestScheduledReport() {
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await apiClient.post(`/reports/scheduled/${id}/test`);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to send test report');
      }
    },
  });
}
